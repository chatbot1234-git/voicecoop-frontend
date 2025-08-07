'use client';
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Vote,
  Users,
  TrendingUp,
  Plus,
  Filter,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ProposalCard } from '@/components/governance/ProposalCard';
import { useGovernanceStore } from '@/stores/governanceStore';
import { useAuth } from '@/stores/authStore';
import { cn } from '@/lib/utils';
export default function GovernancePage() {
  const { user } = useAuth();
  const {
    proposals,
    activeProposals,
    userVotes,
    totalProposals,
    totalVotes,
    participationRate,
    userParticipation,
    loading,
    error,
    fetchProposals,
    fetchUserVotes,
    fetchStats,
    submitVote,
  } = useGovernanceStore();
  const [filter, setFilter] = useState<'all' | 'active' | 'passed' | 'rejected'>('all');
  const [isVoting, setIsVoting] = useState(false);
  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchProposals(),
        fetchStats(),
        user && fetchUserVotes(user.id),
      ]);
    };
    loadData();
  }, [user, fetchProposals, fetchStats, fetchUserVotes]);
  // Filter proposals
  const filteredProposals = proposals.filter(proposal => {
    if (filter === 'all') return true;
    return proposal.status === filter;
  });
  // Handle vote
  const handleVote = async (proposalId: number, voteType: 'for' | 'against' | 'abstain') => {
    try {
      setIsVoting(true);
      await submitVote(proposalId, voteType);
      // Refresh user votes
      if (user) {
        await fetchUserVotes(user.id);
      }
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setIsVoting(false);
    }
  };
  // Get user vote for proposal
  const getUserVote = (proposalId: number) => {
    const vote = userVotes.find(v => v.proposal_id === proposalId);
    return vote?.vote_type || null;
  };
  const stats = [
    {
      name: 'Propositions Totales',
      value: totalProposals,
      icon: <FileText className="h-5 w-5" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      name: 'Votes Actifs',
      value: activeProposals.length,
      icon: <Vote className="h-5 w-5" />,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      name: 'Participation',
      value: `${participationRate}%`,
      icon: <Users className="h-5 w-5" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    },
    {
      name: 'Votre Score',
      value: `${userParticipation}%`,
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    },
  ];
  const filterOptions = [
    { value: 'all', label: 'Toutes', count: proposals.length },
    { value: 'active', label: 'Actives', count: proposals.filter(p => p.status === 'active').length },
    { value: 'passed', label: 'Adoptées', count: proposals.filter(p => p.status === 'passed').length },
    { value: 'rejected', label: 'Rejetées', count: proposals.filter(p => p.status === 'rejected').length },
  ];
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gouvernance Coopérative
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Participez aux décisions qui façonnent l'avenir de VoiceCoop
          </p>
        </div>
        <Button className="flex items-center gap-2" disabled>
          <Plus className="h-4 w-4" />
          Nouvelle Proposition
        </Button>
      </div>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card variant="elevated" className="dark:bg-dark-800 dark:border-dark-600">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {stat.name}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {stat.value}
                    </p>
                  </div>
                  <div className={cn('h-12 w-12 rounded-lg flex items-center justify-center', stat.bgColor)}>
                    <div className={stat.color}>
                      {stat.icon}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      {/* Active Proposals Highlight */}
      {activeProposals.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-primary-200 dark:border-primary-800"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <Vote className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Votes en Cours
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {activeProposals.length} proposition{activeProposals.length > 1 ? 's' : ''} nécessite{activeProposals.length === 1 ? '' : 'nt'} votre attention
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary-600" />
            <span className="text-sm text-primary-700 dark:text-primary-300">
              Participez maintenant pour faire entendre votre voix !
            </span>
          </div>
        </motion.div>
      )}
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Filtrer :
          </span>
        </div>
        <div className="flex items-center gap-2">
          {filterOptions.map(option => (
            <Button
              key={option.value}
              size="sm"
              variant={filter === option.value ? 'primary' : 'outline'}
              onClick={() => setFilter(option.value as any)}
              className="flex items-center gap-2"
            >
              {option.label}
              <span className={cn(
                'px-2 py-0.5 rounded-full text-xs',
                filter === option.value
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              )}>
                {option.count}
              </span>
            </Button>
          ))}
        </div>
      </div>
      {/* Proposals Grid */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <Card className="h-64">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded" />
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      ) : filteredProposals.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnimatePresence>
            {filteredProposals.map((proposal, index) => (
              <motion.div
                key={proposal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
              >
                <ProposalCard
                  proposal={proposal}
                  onVote={handleVote}
                  userVote={getUserVote(proposal.id)}
                  isVoting={isVoting}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="h-16 w-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Aucune proposition trouvée
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {filter === 'all'
              ? 'Aucune proposition n\'a encore été soumise.'
              : `Aucune proposition ${filter === 'active' ? 'active' : filter === 'passed' ? 'adoptée' : 'rejetée'} pour le moment.`
            }
          </p>
        </motion.div>
      )}
      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}