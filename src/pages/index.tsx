import type { NextPage } from 'next';
import Head from 'next/head';
import styles from '../styles/Home.module.scss';
import { useAccount } from 'wagmi';
import { useReadContract, useWriteContract } from 'wagmi';
import { abi as daoABI } from '../../../out/DAO.sol/DAO.json';
import { useState, useEffect } from 'react';

type Meeting = {
  topic: string;
  blockStarted: bigint;
  attendees: unknown[];
};

const Home: NextPage = () => {
  const [lastMeeting, setLastMeeting] = useState<Meeting | null>(null);

  const { data: isMeetingOpen, isError: isMeetingOpenError, isLoading: isMeetingOpenLoading } = useReadContract({
    address: '0x582a7Bf7B31D90fA4D2231C1414A59389Eea7ef3',
    abi: daoABI,
    functionName: 'isMeetingOpen',
  }) as { data: boolean | undefined, isError: boolean, isLoading: boolean };  

  const { data: meetings, isError: meetingsError, isLoading: meetingsLoading } = useReadContract({
    address: '0x582a7Bf7B31D90fA4D2231C1414A59389Eea7ef3',
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
      address: '0x582a7Bf7B31D90fA4D2231C1414A59389Eea7ef3',
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
        <p>Attendees: {Array.isArray(lastMeeting.attendees) ? lastMeeting.attendees.length : 0}</p>
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
        <title>RainbowKit App</title>
        <meta
          content="BU Blockchain's DAO"
          name="617DAO"
        />
        <link rel="shortcut icon" href="/bub.ico" />
      </Head>

      <main className={styles.main}>
        <div className={styles.leftSide}>
          {isMeetingOpen ? <h1>Meeting Details</h1> : <h1>Last Meeting</h1>}
          {renderMeetingDetails()}
        </div>
      </main>
    </div>
  );
};

export default Home;
