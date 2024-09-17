import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import styles from './President.module.scss';
import { useReadContract, useWriteContract } from 'wagmi';
import { abi as daoABI } from '../../../../out/DAO.sol/DAO.json';
import { contractAddresses } from '../../contractConfig';
import { toast } from 'react-toastify';

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
  const [showPopup, setShowPopup] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [activeRole, setActiveRole] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [pendingMeetingAction, setPendingMeetingAction] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputFields(prev => ({ ...prev, [name]: value }));
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

  const handleAddClick = (role: string) => {
    setActiveRole(role);
    setShowPopup(true);
  };

  const handlePopupSubmit = () => {
    const action = activeRole?.startsWith('remove_') ? 'remove' : 'add';
    const role = activeRole?.replace('remove_', '') as 'president' | 'vp' | 'board' | 'member';
    
    if (action === 'add' && role === 'member') {
      handleEnterClick('add', 'member', inputFields.member, newMemberName);
    } else {
      handleEnterClick(action, role, inputFields[role]);
    }
    
    setShowPopup(false);
    setNewMemberName('');
    setInputFields(prev => ({ ...prev, [role]: '' }));
  };

  const handleEnterClick = async (action: 'add' | 'remove', role: string, address?: string, name?: string) => {
    if (action === 'add' && !address) {
      console.log('Input field is empty');
      return;
    }

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

    const pendingActionKey = `${action}_${role}`;
    setPendingAction(pendingActionKey);

    try {
      await writeContract({
        address: contractAddresses.DAO as `0x${string}`,
        abi: daoABI,
        functionName,
        args: role === 'member' && action === 'add' ? [address, name] : [address],
      });
    } catch (error) {
      console.error("Error updating member:", error);
      toast.error(`Error updating member: ${error instanceof Error ? error.message : 'Unknown error'}`, {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    } finally {
      setPendingAction(null);
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
      setPendingAction(null);
      setPendingMeetingAction(null);
    }
  }, [data, refetchMembers]);

  useEffect(() => {
    if (meetings && Array.isArray(meetings) && meetings.length > 0) {
      setCurrentMeeting(meetings[meetings.length - 1] as Meeting);
    }
  }, [meetings]);

  const handleCreateMeeting = async () => {
    setPendingMeetingAction('create');
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
    } finally {
      setPendingMeetingAction(null);
    }
  };

  const handleEndMeeting = async () => {
    setPendingMeetingAction('end');
    try {
      await writeContract({
        address: contractAddresses.DAO as `0x${string}`,
        abi: daoABI,
        functionName: 'endMeeting',
      });
      refetchMeetings();
    } catch (error) {
      console.error("Error ending meeting:", error);
    } finally {
      setPendingMeetingAction(null);
    }
  };

  const handleAddMemberClick = () => {
    setShowPopup(true);
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
                  <button 
                    className={styles.button} 
                    onClick={() => handleAddClick(role)}
                    disabled={pendingAction === `add_${role}` || isPending}
                  >
                    {pendingAction === `add_${role}` || isPending ? 'Processing...' : 'Add'}
                  </button>
                  <button 
                    className={styles.removeButton} 
                    onClick={() => handleAddClick(`remove_${role}`)}
                    disabled={pendingAction === `remove_${role}` || isPending}
                  >
                    {pendingAction === `remove_${role}` || isPending ? 'Processing...' : 'Remove'}
                  </button>
                </div>
              </div>
            ))}

            <div className={styles.sectionTitleMember}>
              <h2>Members</h2>
              <button 
                className={styles.button} 
                onClick={() => handleAddClick('member')}
                disabled={pendingAction === 'add_member' || isPending}
              >
                {pendingAction === 'add_member' || isPending ? 'Processing...' : 'Add Member'}
              </button>
            </div>
            {showPopup && (
              <div className={styles.popup}>
                <div className={styles.popupContent}>
                  <h3>
                    {activeRole?.startsWith('remove_')
                      ? `Remove ${activeRole.replace('remove_', '').charAt(0).toUpperCase()}${activeRole.replace('remove_', '').slice(1)}`
                      : `Add New ${activeRole?.charAt(0).toUpperCase() ?? ''}${activeRole?.slice(1) ?? ''}`}
                  </h3>
                  <input
                    className={styles.input}
                    type="text"
                    value={inputFields[activeRole?.replace('remove_', '') as keyof typeof inputFields]}
                    onChange={(e) => setInputFields(prev => ({ ...prev, [activeRole?.replace('remove_', '') as string]: e.target.value }))}
                    placeholder={`Enter ${activeRole?.replace('remove_', '')} address`}
                  />
                  {activeRole === 'member' && (
                    <input
                      className={styles.input}
                      type="text"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      placeholder="Enter member name"
                    />
                  )}
                  <button 
                    className={styles.button} 
                    onClick={handlePopupSubmit}
                    disabled={isPending}
                  >
                    {isPending ? 'Processing...' : 'Submit'}
                  </button>
                  <button 
                    className={styles.button} 
                    onClick={() => setShowPopup(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
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
                        disabled={pendingAction === `remove_member_${member.memberAddress}` || isPending}
                      >
                        {pendingAction === `remove_member_${member.memberAddress}` || isPending ? 'Processing...' : 'Remove'}
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
              disabled={isMeetingOpen || pendingMeetingAction === 'create' || isPending}
            >
              {pendingMeetingAction === 'create' || isPending ? 'Processing...' : 'Create Meeting'}
            </button>
            <button 
              className={`${styles.button} ${isMeetingOpen ? styles.active : ''}`}
              onClick={handleEndMeeting}
              disabled={!isMeetingOpen || pendingMeetingAction === 'end' || isPending}
            >
              {pendingMeetingAction === 'end' || isPending ? 'Processing...' : 'End Meeting'}
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