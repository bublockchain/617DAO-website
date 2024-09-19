import { useRouter } from 'next/router'
import { useState, useEffect, useRef } from 'react'
import { useBlockNumber, useReadContract, useWriteContract } from 'wagmi'
import { abi as daoABI } from '../../../../abis/DAO.json'
import { contractAddresses } from '../../../contractConfig'
import styles from './Proposal.module.scss'
import { useUser } from "../../../../components/ui/UserProvider"

interface Proposal {
  proposal: string
  timeCreated: bigint
  startBlock: bigint
  endBlock: bigint
  votesFor: bigint
  passed: boolean
  index: bigint
}

const ProposalPage: React.FC = () => {
  const router = useRouter()
  const { proposalNumber } = router.query
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [isProposalClosed, setIsProposalClosed] = useState(false)
  const { address, isMember } = useUser()
  const { data: blockNumber } = useBlockNumber()

  const { data: proposalsData } = useReadContract({
    address: contractAddresses.DAO as `0x${string}`,
    abi: daoABI,
    functionName: 'getProposals',
  })

  const { data: hasVotedData } = useReadContract({
    address: contractAddresses.DAO as `0x${string}`,
    abi: daoABI,
    functionName: 'hasVoted',
    args: [proposalNumber, address],
  })

  const { writeContract, isPending } = useWriteContract()

  const descriptionRef = useRef<HTMLHeadingElement>(null)
  const [isDescriptionLong, setIsDescriptionLong] = useState(false)

  useEffect(() => {
    if (proposalsData && Array.isArray(proposalsData) && proposalNumber && blockNumber) {
      const index = Number(proposalNumber)
      if (index >= 0 && index < proposalsData.length) {
        setProposal(proposalsData[index] as Proposal)
        setIsProposalClosed(BigInt(proposalsData[index].endBlock) < BigInt(blockNumber))
      }
    }
  }, [proposalsData, proposalNumber, blockNumber])

  useEffect(() => {
    if (hasVotedData !== undefined) {
      setHasVoted(hasVotedData as boolean)
    }
  }, [hasVotedData])

  useEffect(() => {
    if (descriptionRef.current) {
      setIsDescriptionLong(descriptionRef.current.scrollHeight > descriptionRef.current.clientHeight)
    }
  }, [proposal])

  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  const handleVote = async () => {
    if (!proposal) return
    try {
      await writeContract({
        address: contractAddresses.DAO as `0x${string}`,
        abi: daoABI,
        functionName: 'voteForProposal',
        args: [proposal.index],
      })
      setHasVoted(true)
    } catch (error) {
      console.error("Error voting for proposal:", error)
    }
  }

  const getVoteMessage = () => {
    if (!address) return "Not Signed In"
    if (!isMember) return "Members Only"
    if (proposal?.passed) return "Proposal Passed"
    if (isProposalClosed) return "Proposal Ended"
    if (hasVoted) return "Already Voted"
    return ""
  }

  if (!proposal) {
    return <div>Loading...</div>
  }

  return (
    <div className={styles.proposalContainer}>
      <h1 
        ref={descriptionRef}
        className={`${styles.proposalDescription} ${isDescriptionLong ? styles.proposalDescriptionLong : ''}`}
      >
        {capitalizeFirstLetter(proposal.proposal)}
      </h1>
      <div className={styles.proposalInfo}>
        <div className={styles.infoItem}>
          <p className={styles.infoLabel}>Index:</p>
          <p className={styles.infoValue}>{proposal.index.toString()}</p>
        </div>
        <div className={styles.infoItem}>
          <p className={styles.infoLabel}>Time Created:</p>
          <p className={styles.infoValue}>{new Date(Number(proposal.timeCreated) * 1000).toLocaleString()}</p>
        </div>
        <div className={styles.infoItem}>
          <p className={styles.infoLabel}>Start Block:</p>
          <p className={styles.infoValue}>{proposal.startBlock.toString()}</p>
        </div>
        <div className={styles.infoItem}>
          <p className={styles.infoLabel}>End Block:</p>
          <p className={styles.infoValue}>{proposal.endBlock.toString()}</p>
        </div>
        <div className={styles.infoItem}>
          <p className={styles.infoLabel}>Votes For:</p>
          <p className={styles.infoValue}>{proposal.votesFor.toString()}</p>
        </div>
        <div className={styles.infoItem}>
          <p className={styles.infoLabel}>Status:</p>
          <p className={`${styles.infoValue} ${proposal.passed ? styles.statusPassed : styles.statusNotPassed}`}>
            {proposal.passed ? 'Passed' : 'Not Passed'}
          </p>
        </div>
      </div>
      <div className={styles.voteSection}>
        {getVoteMessage() ? (
          <p className={styles.voteMessage}>{getVoteMessage()}</p>
        ) : (
          <button 
            className={styles.voteButton}
            onClick={handleVote} 
            disabled={isPending}
          >
            {isPending ? 'Voting...' : 'Vote'}
          </button>
        )}
      </div>
    </div>
  )
}

export default ProposalPage

// TODO: Add create proposal button and popup
// TODO: fix toast errors on president page
// TODO: Make check in page
