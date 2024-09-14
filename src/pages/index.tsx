import type { NextPage } from 'next';
import Head from 'next/head';
import styles from '../styles/Home.module.scss';
import { useAccount } from 'wagmi';
import { useReadContract, useWriteContract } from 'wagmi';
import { abi as daoABI } from '../../../out/DAO.sol/DAO.json';
import { useState, useEffect } from 'react';
import { contractAddresses } from '../contractConfig';

type Meeting = {
  topic: string;
  blockStarted: bigint;
  timestampStarted: bigint;
  attendees: unknown[];
};

const Home: NextPage = () => {
  const [lastMeeting, setLastMeeting] = useState<Meeting | null>(null);

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

  const { writeContract: checkIn, isPending: isCheckInPending } = useWriteContract();

  useEffect(() => {
    if (meetings && Array.isArray(meetings) && meetings.length > 0) {
      setLastMeeting(meetings[meetings.length - 1] as Meeting);
    }
  }, [meetings]);

  const handleCheckIn = () => {
    checkIn({
      address: contractAddresses.DAO as `0x${string}`,
      abi: daoABI,
      functionName: 'checkIn',
    });
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
        <p>Time Started: {new Date(Number(lastMeeting.timestampStarted) * 1000).toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'full', timeStyle: 'long' })}</p>
        <div>
          <p>Attendees: {Array.isArray(lastMeeting.attendees) ? lastMeeting.attendees.length : 0}</p>
          <div className={styles.attendeesList}>
            {Array.isArray(lastMeeting.attendees) && lastMeeting.attendees.map((attendee: any, index: number) => (
              <p key={index}>{attendee}</p>
            ))}
          </div>
        </div>
        {isMeetingOpen === true && (
          <button onClick={handleCheckIn} disabled={isCheckInPending}>
            {isCheckInPending ? 'Checking In...' : 'Check In'}
          </button>
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
      </main>
    </div>
  );
};

export default Home;
