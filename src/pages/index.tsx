import type { NextPage } from 'next';
import Head from 'next/head';
import styles from '@/src/styles/Home.module.scss';
import { useAccount } from 'wagmi';
import { useReadContract, useWriteContract, useBlockNumber } from 'wagmi';
import { abi as daoABI } from '@/abis/DAO.json';
import { useState, useEffect, useMemo } from 'react';
import { contractAddresses } from '@/src/contractConfig';
import Link from 'next/link';
import { useUser } from "@/components/ui/UserProvider";
import { useMediaQuery } from 'react-responsive';

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
  const [filterType, setFilterType] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc');
  const [newProposalText, setNewProposalText] = useState('');
  const [isNewProposalModalOpen, setIsNewProposalModalOpen] = useState(false);
  const isMobile = useMediaQuery({ maxWidth: 767 });

  const { data: currentBlock } = useBlockNumber();

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
  }) as { data: Meeting[] | undefined, isError: boolean, isLoading: boolean };

  const { data: proposalsData, isError: proposalsError, isLoading: proposalsLoading, refetch: refetchProposalsData } = useReadContract({
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
      const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000; 
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
    if (!newProposalText.trim()) return;

    try {
      await writeContract({
        address: contractAddresses.DAO as `0x${string}`,
        abi: daoABI,
        functionName: 'newProposal',
        args: [newProposalText],
      });
      setNewProposalText('');
      setIsNewProposalModalOpen(false);
      await refetchProposalsData();
    } catch (error) {
      console.error("Error creating new proposal:", error);
    }
  };

  const sortedAndFilteredProposals = useMemo(() => {
    let filtered = [...proposals];
    
    if (filterType !== 'all' && currentBlock) {
      filtered = filtered.filter(p => {
        if (filterType === 'active') return !p.passed && Number(p.endBlock) > currentBlock;
        if (filterType === 'inactive') return !p.passed && Number(p.endBlock) <= currentBlock;
        if (filterType === 'passed') return p.passed;
      });
    }

    return filtered.sort((a, b) => {
      const timeA = Number(a.timeCreated);
      const timeB = Number(b.timeCreated);
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });
  }, [proposals, filterType, sortOrder, currentBlock]);

  const renderMeetingDetails = () => {
    if (meetingsLoading || isMeetingOpenLoading) {
      return <div>Loading...</div>;
    }

    if (meetingsError || isMeetingOpenError) {
      return <div>Error loading meeting details</div>;
    }

    if (!lastMeeting || !meetings) {
      return <div>No meetings found</div>;
    }

    const meetingIndex = meetings?.length ?? 0;

    return (
      <div className={styles.meetingContainer}>
        <div className={styles.meetingDetails}>
          <h1>Meeting {meetingIndex}</h1>
          <div className={styles.underline}></div>
          <h2 className={styles.meetingTopic}>{lastMeeting.topic}</h2>
          <p>{new Date(Number(lastMeeting.timestampStarted) * 1000).toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'full', timeStyle: 'short' }).replace(/:\d{2}\s/, ' ')}</p>
          <p>Block Started: <Link className={styles.link} href={`https://amoy.polygonscan.com/block/${lastMeeting.blockStarted.toString()}`} target="_blank">{lastMeeting.blockStarted.toString()}</Link></p>
        </div>
        <div className={styles.attendeesSection}>
          <div className={styles.attendeesList}>
            <h3>Attendees: {Array.isArray(lastMeeting.attendees) ? lastMeeting.attendees.length : 0}</h3>
            {Array.isArray(lastMeeting.attendees) && lastMeeting.attendees.map((attendee: any, index: number) => (
              <p key={index}>{`${attendee.slice(0, 12)}...${attendee.slice(-12)}`}</p>
            ))}
          </div>
          {isMeetingOpen === true && (
            isMobile ? (
              <button 
                className={styles.checkInButton}
                disabled={true}
              >
                Not Available On Mobile
              </button>
            ) : (
              <button 
                onClick={isMember && !isUserCheckedIn ? handleCheckIn : undefined} 
                disabled={isCheckInPending || isUserCheckedIn || !isMember} 
                className={isUserCheckedIn ? styles.checkedInButton : styles.checkInButton}
              >
                {isCheckInPending ? 'Checking In...' : 
                 isUserCheckedIn ? 'Checked In' : 
                 !isMember ? 'Not Member' : 'Check In'}
              </button>
            )
          )}
        </div>
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
      <div className={styles.proposalsSection}>
        <div className={styles.proposalsControls}>
          {!isMobile && (
            <button 
              className={styles.newProposalButton} 
              onClick={() => setIsNewProposalModalOpen(true)}
            >
              New Proposal
            </button>
          )}
          <div className={styles.filterControls}>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="all">All Proposals</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="passed">Passed</option>
            </select>
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>
        <div className={styles.proposalsTable}>
          <div className={styles.tableHeader}>
            <div>Number</div>
            <div>Proposal</div>
            <div>Time Created</div>
            <div>End Block</div>
            <div>Votes For</div>
            <div>Status</div>
          </div>
          {sortedAndFilteredProposals.map((proposal, index) => (
            <div key={index} className={styles.tableRow}>
              <Link href={`/proposal/${proposal.index}`}>
                <div className={styles.proposalNumber}>{Number(proposal.index) + 1}</div>
              </Link>
              <div>{proposal.proposal}</div>
              <div>{new Date(Number(proposal.timeCreated) * 1000).toLocaleString()}</div>
              <div>{proposal.endBlock.toString()}</div>
              <div>{proposal.votesFor.toString()}</div>
              <div>{proposal.passed ? 'Passed' : currentBlock && Number(proposal.endBlock) > currentBlock ? 'Active' : 'Inactive'}</div>
            </div>
          ))}
        </div>
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
          {renderMeetingDetails()}
        </div>
        {renderProposals()}
      </main>
      {isNewProposalModalOpen && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>New Proposal</h2>
            <textarea 
              value={newProposalText}
              onChange={(e) => setNewProposalText(e.target.value)}
              placeholder="Enter proposal description"
            />
            <div className={styles.modalButtons}>
              <button onClick={handleNewProposal}>Submit</button>
              <button onClick={() => setIsNewProposalModalOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
