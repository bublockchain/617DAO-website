import type { NextPage } from 'next';
import Head from 'next/head';
import styles from '@/src/styles/Home.module.scss';
import { useAccount } from 'wagmi';
import { useReadContract, useWriteContract } from 'wagmi';
import { abi as daoABI } from '@/abis/DAO.json';
import { useState, useEffect } from 'react';
import { contractAddresses } from '@/src/contractConfig';
import Link from 'next/link';
import { useUser } from "@/components/ui/UserProvider";


type Meeting = {
  topic: string;
  blockStarted: bigint;
  timestampStarted: bigint;
  attendees: string[];
};

type Proposal = {
  proposal: string;
  timeCreated: bigint;
  startBlock: bigint;
  endBlock: bigint;
  votesFor: bigint;
  passed: boolean;
  index: bigint;
};

const Home: NextPage = () => {
  const [lastMeeting, setLastMeeting] = useState<Meeting | null>(null);
  const [isUserCheckedIn, setIsUserCheckedIn] = useState(false);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const { address } = useAccount();
  const [newProposal, setNewProposal] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProposalDialogOpen, setIsProposalDialogOpen] = useState(false);

  const { data: checkedInStatus, refetch: refetchCheckedInStatus } = useReadContract({
    address: contractAddresses.DAO as `0x${string}`,
    abi: daoABI,
    functionName: 'isCheckedIn',
    args: [address],
  }) as { data: boolean | undefined, refetch: () => void };

  const { data: isMeetingOpen, isError: isMeetingOpenError, isLoading: isMeetingOpenLoading } = useReadContract({
    address: contractAddresses.DAO as `0x${string}`,
    abi: daoABI,
    functionName: 'isMeetingOpen',
  }) as { data: boolean | undefined, isError: boolean, isLoading: boolean };  

  const { data: meetings, isError: meetingsError, isLoading: meetingsLoading } = useReadContract({
    address: contractAddresses.DAO as `0x${string}`,
    abi: daoABI,
    functionName: 'getMeetings',
  });

  const { data: proposalsData, isError: proposalsError, isLoading: proposalsLoading } = useReadContract({
    address: contractAddresses.DAO as `0x${string}`,
    abi: daoABI,
    functionName: 'getProposals',
  });

  const { writeContract, isPending: isCheckInPending } = useWriteContract();

  const { isMember } = useUser();

  useEffect(() => {
    if (meetings && Array.isArray(meetings) && meetings.length > 0) {
      setLastMeeting(meetings[meetings.length - 1] as Meeting);
    }
    if (checkedInStatus !== undefined) {
      setIsUserCheckedIn(checkedInStatus);
      console.log("Checked in status:", checkedInStatus);
    }
    if (proposalsData && Array.isArray(proposalsData)) {
      const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
      setProposals(proposalsData.filter(proposal => 
        Number(proposal.timeCreated) * 1000 > oneMonthAgo
      ));
    }
  }, [meetings, checkedInStatus, proposalsData]);

  const handleCheckIn = async () => {
    try {
      await writeContract({
        address: contractAddresses.DAO as `0x${string}`,
        abi: daoABI,
        functionName: 'checkIn',
      });
      await refetchCheckedInStatus();
      setIsUserCheckedIn(true);
      
      // Update the lastMeeting state to include the new attendee
      if (lastMeeting && address) {
        setLastMeeting(prevMeeting => prevMeeting ? {
          ...prevMeeting,
          attendees: [...prevMeeting.attendees, address]
        } : null);
      }
    } catch (error) {
      console.error("Error checking in:", error);
    }
  };

  const handleNewProposal = async () => {
    if (!newProposal.trim()) return;

    try {
      await writeContract({
        address: contractAddresses.DAO as `0x${string}`,
        abi: daoABI,
        functionName: 'newProposal',
        args: [newProposal],
      });
      setNewProposal('');
      setIsProposalDialogOpen(false);
      // You might want to add a toast notification here
    } catch (error) {
      console.error("Error creating new proposal:", error);
      // You might want to add an error toast notification here
    }
  };

  const renderMeetingDetails = () => {
    if (meetingsLoading || isMeetingOpenLoading) {
      return <div>Loading...</div>;
    }

    if (meetingsError || isMeetingOpenError) {
      return <div>Error loading meeting details</div>;
    }

    if (!lastMeeting) {
      return <div>No meetings found</div>;
    }

    return (
      <div>
        <h2>Topic: {lastMeeting.topic}</h2>
        <p>Block Started: {lastMeeting.blockStarted.toString()}</p>
        <p>Time Started: {new Date(Number(lastMeeting.timestampStarted) * 1000).toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'full', timeStyle: 'short' }).replace(/:\d{2}\s/, ' ')}</p>
        <div>
          <p>Attendees: {Array.isArray(lastMeeting.attendees) ? lastMeeting.attendees.length : 0}</p>
          <div className={styles.attendeesList}>
            {Array.isArray(lastMeeting.attendees) && lastMeeting.attendees.map((attendee: any, index: number) => (
              <p key={index}>{attendee}</p>
            ))}
          </div>
        </div>
        {isMeetingOpen === true && (
          <button 
            onClick={isMember && !isUserCheckedIn ? handleCheckIn : undefined} 
            disabled={isCheckInPending || isUserCheckedIn || !isMember} 
            className={isUserCheckedIn ? styles.checkedInButton : styles.checkInButton}
          >
            {isCheckInPending ? 'Checking In...' : 
             isUserCheckedIn ? 'Checked In' : 
             !isMember ? 'Not Member' : 'Check In'}
          </button>
        )}

      </div>
    );
  };

  const renderProposals = () => {
    if (proposalsLoading) {
      return <div>Loading proposals...</div>;
    }

    if (proposalsError) {
      return <div>Error loading proposals</div>;
    }

    return (
      <div className={styles.proposalsContainer}>
        <div className={styles.proposalsList}>
          {proposals.length === 0 ? (
            <div className={styles.noProposals}>No proposals found</div>
          ) : (
            proposals.map((proposal, index) => (
              <Link href={`/proposal/${proposal.index.toString()}`} key={index}>
                <div className={`${styles.proposalItem} ${styles.proposalButton}`}>
                  <h3>Proposal {proposal.index.toString()}</h3>
                  <p>{proposal.proposal}</p>
                  <p>Votes: {proposal.votesFor.toString()}</p>
                  <p>Status: {proposal.passed ? 'Passed' : 'Open'}</p>
                  <p>Created: {new Date(Number(proposal.timeCreated) * 1000).toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'full', timeStyle: 'short' }).replace(/:\d{2}\s/, ' ')}</p>
                </div>
              </Link>
            ))
          )}
        </div>
        <button 
          className={styles.addProposalButton}
          onClick={() => setIsProposalDialogOpen(true)}
        >
          Add Proposal
        </button>
        {isProposalDialogOpen && (
          <div className={styles.popup}>
            <div className={styles.popupContent}>
              <h3>Add New Proposal</h3>
              <textarea
                className={styles.proposalInput}
                value={newProposal}
                onChange={(e) => setNewProposal(e.target.value)}
                placeholder="Enter your proposal here"
              />
              <button 
                className={styles.button} 
                onClick={handleNewProposal}
              >
                Submit
              </button>
              <button 
                className={styles.button} 
                onClick={() => setIsProposalDialogOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>617DAO</title>
        <meta
          content="BU Blockchain's DAO"
          name="617DAO"
        />
        <link rel="shortcut icon" href="/bub.ico" />
      </Head>

      <main className={styles.main}>
        <div className={styles.leftSide}>
          {isMeetingOpen ? <h1>Meeting Details</h1> : <h1>Last Meeting </h1>}
          <div className={styles.underline}></div>
          {renderMeetingDetails()}
        </div>
        <div className={styles.rightSide}>
          <h1>Proposals</h1>
          <div className={styles.underline}></div>
          {renderProposals()}
        </div>
      </main>
    </div>
  );
};

export default Home;
