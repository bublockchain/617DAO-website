import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import styles from './President.module.scss';
import { useReadContract, useWriteContract } from 'wagmi';
import { abi as daoABI } from '../../../../out/DAO.sol/DAO.json';
import { contractAddresses } from '../../contractConfig';

interface Member {
  memberAddress: string;
  name: string;
}

interface Meeting {
  blockStarted: bigint;
  timestampStarted: bigint;
  topic: string;
  attendees: string[];
  open: boolean;
}

const President: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [inputFields, setInputFields] = useState({
    president: '',
    vp: '',
    board: '',
    member: '',
  });
  const [activeInput, setActiveInput] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputFields(prev => ({ ...prev, [name]: value }));
  };

  const handleButtonClick = (field: string) => {
    setActiveInput(field);
  };

  const { 
    writeContract, 
    data, 
    error, 
    isError, 
    isIdle, 
    isPending, 
    isSuccess,
    reset 
  } = useWriteContract();

  const handleEnterClick = async (action: 'add' | 'remove', role: string, address?: string) => {
    if (action === 'add' && !inputFields[role as keyof typeof inputFields]) {
      console.log('Input field is empty');
      return;
    }

    const memberAddress = address || inputFields[role as keyof typeof inputFields];
    let functionName = '';

    switch (role) {
      case 'member':
        functionName = action === 'add' ? 'addMember' : 'removeMember';
        break;
      case 'president':
        functionName = action === 'add' ? 'addPresident' : 'removePresident';
        break;
      case 'vp':
        functionName = action === 'add' ? 'addVP' : 'removeVP';
        break;
      case 'board':
        functionName = action === 'add' ? 'addBoard' : 'removeBoard';
        break;
    }

    try {
      writeContract({
        address: contractAddresses.DAO as `0x${string}`,
        abi: daoABI,
        functionName,
        args: [memberAddress],
      });
    } catch (error) {
      console.error("Error updating member:", error);
    }
  };

  const { data: membersList, isError: isMembersError, isLoading, refetch: refetchMembers } = useReadContract({
    address: contractAddresses.DAO as `0x${string}`,
    abi: daoABI,
    functionName: 'membersList',
  }) as { data: Member[] | undefined, isError: boolean, isLoading: boolean, refetch: () => void };

  const [currentMeeting, setCurrentMeeting] = useState<Meeting | null>(null);

  const { data: isMeetingOpen } = useReadContract({
    address: contractAddresses.DAO as `0x${string}`,
    abi: daoABI,
    functionName: 'isMeetingOpen',
  }) as { data: boolean | undefined };

  const { data: meetings, refetch: refetchMeetings } = useReadContract({
    address: contractAddresses.DAO as `0x${string}`,
    abi: daoABI,
    functionName: 'getMeetings',
  });

  useEffect(() => {
    if (data) {
      refetchMembers();
    }
  }, [data, refetchMembers]);

  useEffect(() => {
    if (meetings && Array.isArray(meetings) && meetings.length > 0) {
      setCurrentMeeting(meetings[meetings.length - 1] as Meeting);
    }
  }, [meetings]);

  const handleCreateMeeting = async () => {
    try {
      await writeContract({
        address: contractAddresses.DAO as `0x${string}`,
        abi: daoABI,
        functionName: 'newMeeting',
        args: ["New Meeting"], // You might want to add an input for the topic
      });
      refetchMeetings();
    } catch (error) {
      console.error("Error creating meeting:", error);
    }
  };

  const handleEndMeeting = async () => {
    try {
      await writeContract({
        address: contractAddresses.DAO as `0x${string}`,
        abi: daoABI,
        functionName: 'endMeeting',
      });
      refetchMeetings();
    } catch (error) {
      console.error("Error ending meeting:", error);
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>President Dashboard</title>
        <meta
          content="BU Blockchain's DAO"
          name="617DAO"
        />
        <link rel="shortcut icon" href="/bub.ico" />
      </Head>

      <main className={styles.main}>
        <div className={styles.leftSide}>
          <h1>Member Management</h1>
          <div className={styles.dashboard}>
            {['president', 'vp', 'board'].map((role) => (
              <div key={role}>
                <div className={styles.sectionTitle}>
                  <h2>{role.charAt(0).toUpperCase() + role.slice(1)}</h2>
                </div>
                <div className={styles.buttonGroup}>
                  {activeInput === `add_${role}` ? (
                    <>
                      <input
                        className={styles.input}
                        type="text"
                        name={role}
                        value={inputFields[role as keyof typeof inputFields]}
                        onChange={handleInputChange}
                        placeholder={`Enter ${role} address`}
                        disabled={isPending}
                      />
                      <button 
                        className={styles.button} 
                        onClick={() => handleEnterClick('add', role)}
                        disabled={isPending}
                      >
                        {isPending ? 'Processing...' : 'Enter'}
                      </button>
                    </>
                  ) : (
                    <button 
                      className={styles.button} 
                      onClick={() => handleButtonClick(`add_${role}`)}
                      disabled={isPending}
                    >
                      Add
                    </button>
                  )}
                  {activeInput === `remove_${role}` ? (
                    <>
                      <input
                        className={styles.input}
                        type="text"
                        name={role}
                        value={inputFields[role as keyof typeof inputFields]}
                        onChange={handleInputChange}
                        placeholder={`Enter ${role} address`}
                        disabled={isPending}
                      />
                      <button 
                        className={styles.button} 
                        onClick={() => handleEnterClick('remove', role)}
                        disabled={isPending}
                      >
                        {isPending ? 'Processing...' : 'Enter'}
                      </button>
                    </>
                  ) : (
                    <button 
                      className={styles.removeButton} 
                      onClick={() => handleButtonClick(`remove_${role}`)}
                      disabled={isPending}
                    >
                      Remove
                    </button>
                  )}
                  {isError && <p className={styles.errorMessage}>Error: {error?.message}</p>}
                  {isSuccess && <p className={styles.successMessage}>Operation successful!</p>}
                </div>
              </div>
            ))}

            <div className={styles.sectionTitleMember}>
              <h2>Members</h2>
              {activeInput === 'add_member' ? (
                <>
                  <input
                    className={styles.input}
                    type="text"
                    name="member"
                    value={inputFields.member}
                    onChange={handleInputChange}
                    placeholder="Enter member address"
                    disabled={isPending}
                  />
                  <button 
                    className={styles.button} 
                    onClick={() => handleEnterClick('add', 'member')}
                    disabled={isPending}
                  >
                    {isPending ? 'Processing...' : 'Enter'}
                  </button>
                </>
              ) : (
                <button 
                  className={styles.button} 
                  onClick={() => handleButtonClick('add_member')}
                  disabled={isPending}
                >
                  Add
                </button>
              )}
            </div>
            {isLoading ? (
              <div>Loading members...</div>
            ) : isMembersError ? (
              <div>Error loading members. Please try again.</div>
            ) : membersList && membersList.length > 0 ? (
              <div className={styles.membersList}>
                {membersList.map((member, index) => {
                  const loadingKey = `remove_member_${member.memberAddress}`;
                  return (
                    <div key={index} className={styles.member}>
                      <span className={styles.memberName}>{member.name}</span>
                      <span className={styles.memberAddress}>{`${member.memberAddress.slice(0, 6)}...${member.memberAddress.slice(-6)}`}</span>
                      <button 
                        className={styles.removeButton} 
                        onClick={() => handleEnterClick('remove', 'member', member.memberAddress)}
                        disabled={isPending}
                      >
                        {isPending ? 'Processing...' : 'Remove'}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div>No members found.</div>
            )}
          </div>
        </div>
        <div className={styles.rightSide}>
          <h1>Meeting</h1>
          <div className={styles.underline}></div>
          <div className={styles.meetingManagement}>
            <button 
              className={`${styles.button} ${!isMeetingOpen ? styles.active : ''}`}
              onClick={handleCreateMeeting}
              disabled={isMeetingOpen || isPending}
            >
              {isPending ? 'Processing...' : 'Create Meeting'}
            </button>
            <button 
              className={`${styles.button} ${isMeetingOpen ? styles.active : ''}`}
              onClick={handleEndMeeting}
              disabled={!isMeetingOpen || isPending}
            >
              {isPending ? 'Processing...' : 'End Meeting'}
            </button>
          </div>
          <div className={styles.meetingDetails}>
            <h2>{isMeetingOpen ? "Current Meeting Details" : "Last Meeting Details"}</h2>
            <div className={styles.underline}></div>
            {currentMeeting && (
              <div className={styles.meetingInfo}>
                <p>Meeting Title: {currentMeeting.topic}</p>
                <p>Meeting Date: {new Date(Number(currentMeeting.timestampStarted) * 1000).toLocaleDateString()}</p>
                <p>Meeting Time: {new Date(Number(currentMeeting.timestampStarted) * 1000).toLocaleTimeString()}</p>
                <p>Meeting Status: {currentMeeting.open ? "Open" : "Closed"}</p>
              </div>
            )}
          </div>
          {currentMeeting && (
            <div className={styles.attendeesList}>
              <h3>Attendees</h3>
              <ul>
                {currentMeeting.attendees.map((attendee, index) => (
                  <li key={index}>{attendee}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default President;

// TODO: Fix loading states
// TODO: fix formatting of add button next to member
// TODO: fix address size in member list
// TODO: need to check if I can remove last member with test cases