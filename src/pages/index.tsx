import type { NextPage } from 'next';
import Head from 'next/head';
import styles from '../styles/Home.module.scss';
import { useAccount } from 'wagmi';
import { useReadContract, useWriteContract } from 'wagmi';
import { abi as daoABI } from '../../../out/DAO.sol/DAO.json';
import { useState, useEffect } from 'react';
import { contractAddresses } from '../contractConfig';
import Link from 'next/link';

type Meeting = {
  topic: string;
  blockStarted: bigint;
  timestampStarted: bigint;
  attendees: unknown[];
};

type Proposal = {
  proposal: string;
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

  const { writeContract: checkIn, isPending: isCheckInPending } = useWriteContract();

  useEffect(() => {
    if (meetings && Array.isArray(meetings) && meetings.length > 0) {
      setLastMeeting(meetings[meetings.length - 1] as Meeting);
    }
    if (checkedInStatus !== undefined) {
      setIsUserCheckedIn(checkedInStatus);
      console.log("Checked in status:", checkedInStatus);
    }
    if (proposalsData && Array.isArray(proposalsData)) {
      setProposals(proposalsData as Proposal[]);
    }
  }, [meetings, checkedInStatus, proposalsData]);

  const handleCheckIn = async () => {
    try {
      await checkIn({
        address: contractAddresses.DAO as `0x${string}`,
        abi: daoABI,
        functionName: 'checkIn',
      });
      await refetchCheckedInStatus();
      setIsUserCheckedIn(true);
    } catch (error) {
      console.error("Error checking in:", error);
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
            onClick={isUserCheckedIn ? undefined : handleCheckIn} 
            disabled={isCheckInPending || isUserCheckedIn} 
            className={isUserCheckedIn ? styles.checkedInButton : styles.checkInButton}
          >
            {isCheckInPending ? 'Checking In...' : isUserCheckedIn ? 'Checked In' : 'Check In'}
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
      <div className={styles.proposalsList}>
        {proposals.map((proposal, index) => (
          <Link href={`/proposal/${proposal.index.toString()}`} key={index}>
            <div className={`${styles.proposalItem} ${styles.proposalButton}`}>
              <h3>Proposal {proposal.index.toString()}</h3>
              <p>{proposal.proposal}</p>
              <p>Votes: {proposal.votesFor.toString()}</p>
              <p>Status: {proposal.passed ? 'Passed' : 'Open'}</p>
            </div>
          </Link>
        ))}
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
