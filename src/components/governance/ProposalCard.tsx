import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ThumbsUp,
  ThumbsDown,
  Minus,
  Clock,
  User,
  Calendar,
  TrendingUp,
  MessageSquare,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { GovernanceProposal } from '@/types';
import { cn, formatters } from '@/lib/utils';
interface ProposalCardProps {
  proposal: GovernanceProposal;
  onVote?: (_proposalId: number, _voteType: 'for' | 'against' | 'abstain') => void;
  onViewDetails?: (proposal: GovernanceProposal) => void;
  userVote?: 'for' | 'against' | 'abstain' | null;
  isVoting?: boolean;
  className?: string;
}
export const ProposalCard: React.FC<ProposalCardProps> = ({
  proposal,
  onVote,
  onViewDetails,
  userVote,
  isVoting = false,
  className,
}) => {
  const [showFullDescription, setShowFullDescription] = useState(false);
  const totalVotes = proposal.votes_for + proposal.votes_against + proposal.votes_abstain;
  const forPercentage = totalVotes > 0 ? (proposal.votes_for / totalVotes) * 100 : 0;
  const againstPercentage = totalVotes > 0 ? (proposal.votes_against / totalVotes) * 100 : 0;
  const abstainPercentage = totalVotes > 0 ? (proposal.votes_abstain / totalVotes) * 100 : 0;
  const isActive = proposal.status === 'active';
  const isPassed = proposal.status === 'passed';
  const isRejected = proposal.status === 'rejected';
  const isDraft = proposal.status === 'draft';
  const getStatusColor = () => {
    switch (proposal.status) {
      case 'active': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
      case 'passed': return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      case 'rejected': return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      case 'draft': return 'text-gray-600 bg-gray-100 dark:bg-gray-800';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-800';
    }
  };
  const getStatusText = () => {
    switch (proposal.status) {
      case 'active': return 'Vote en cours';
      case 'passed': return 'Adoptée';
      case 'rejected': return 'Rejetée';
      case 'draft': return 'Brouillon';
      default: return 'Inconnu';
    }
  };
  const timeRemaining = proposal.voting_deadline ?
    new Date(proposal.voting_deadline).getTime() - Date.now() : 0;
  const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));
  const truncatedDescription = proposal.description.length > 150
    ? proposal.description.substring(0, 150) + '...'
    : proposal.description;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Card
        variant="elevated"
        className="h-full hover:shadow-xl transition-all duration-300 dark:bg-dark-800 dark:border-dark-600"
      >
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
                {proposal.title}
              </CardTitle>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>Auteur #{proposal.author_id}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatters.date(proposal.created_at)}</span>
                </div>
              </div>
            </div>
            <div className={cn(
              'px-3 py-1 rounded-full text-xs font-medium',
              getStatusColor()
            )}>
              {getStatusText()}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Description */}
          <div className="mb-6">
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              {showFullDescription ? proposal.description : truncatedDescription}
            </p>
            {proposal.description.length > 150 && (
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="text-primary-600 dark:text-primary-400 text-sm font-medium mt-2 hover:underline"
              >
                {showFullDescription ? 'Voir moins' : 'Voir plus'}
              </button>
            )}
          </div>
          {/* Voting Results */}
          {totalVotes > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Résultats du vote
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {totalVotes} vote{totalVotes > 1 ? 's' : ''}
                </span>
              </div>
              {/* Progress bars */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 w-20">
                    <ThumbsUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">
                      {Math.round(forPercentage)}%
                    </span>
                  </div>
                  <div className="flex-1 bg-gray-200 dark:bg-dark-700 rounded-full h-2">
                    <motion.div
                      className="bg-green-500 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${forPercentage}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-8">
                    {proposal.votes_for}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 w-20">
                    <ThumbsDown className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-600">
                      {Math.round(againstPercentage)}%
                    </span>
                  </div>
                  <div className="flex-1 bg-gray-200 dark:bg-dark-700 rounded-full h-2">
                    <motion.div
                      className="bg-red-500 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${againstPercentage}%` }}
                      transition={{ duration: 0.8, delay: 0.4 }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-8">
                    {proposal.votes_against}
                  </span>
                </div>
                {proposal.votes_abstain > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 w-20">
                      <Minus className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-600">
                        {Math.round(abstainPercentage)}%
                      </span>
                    </div>
                    <div className="flex-1 bg-gray-200 dark:bg-dark-700 rounded-full h-2">
                      <motion.div
                        className="bg-gray-500 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${abstainPercentage}%` }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400 w-8">
                      {proposal.votes_abstain}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
          {/* Time remaining */}
          {isActive && daysRemaining > 0 && (
            <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {daysRemaining} jour{daysRemaining > 1 ? 's' : ''} restant{daysRemaining > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          )}
          {/* User vote indicator */}
          {userVote && (
            <div className="mb-4 p-2 bg-gray-50 dark:bg-dark-700 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                {userVote === 'for' && <ThumbsUp className="h-4 w-4 text-green-600" />}
                {userVote === 'against' && <ThumbsDown className="h-4 w-4 text-red-600" />}
                {userVote === 'abstain' && <Minus className="h-4 w-4 text-gray-600" />}
                <span className="text-gray-600 dark:text-gray-300">
                  Vous avez voté : {
                    userVote === 'for' ? 'Pour' :
                    userVote === 'against' ? 'Contre' : 'Abstention'
                  }
                </span>
              </div>
            </div>
          )}
          {/* Actions */}
          <div className="flex items-center gap-2">
            {isActive && !userVote && onVote && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onVote(proposal.id, 'for')}
                  disabled={isVoting}
                  className="flex-1 text-green-600 border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                >
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  Pour
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onVote(proposal.id, 'against')}
                  disabled={isVoting}
                  className="flex-1 text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <ThumbsDown className="h-4 w-4 mr-1" />
                  Contre
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onVote(proposal.id, 'abstain')}
                  disabled={isVoting}
                  className="text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </>
            )}
            {onViewDetails && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onViewDetails(proposal)}
                className="ml-auto"
              >
                <Eye className="h-4 w-4 mr-1" />
                Détails
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
export default ProposalCard;