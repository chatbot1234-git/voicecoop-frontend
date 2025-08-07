import { create } from 'zustand';
import { GovernanceProposal, Vote } from '@/types';
import { API_ENDPOINTS } from '@/lib/config';
import { authenticatedFetch } from './authStore';
interface GovernanceState {
  // Proposals
  proposals: GovernanceProposal[];
  activeProposals: GovernanceProposal[];
  userVotes: Vote[];
  // Stats
  totalProposals: number;
  totalVotes: number;
  participationRate: number;
  userParticipation: number;
  // UI State
  loading: boolean;
  error: string | null;
  selectedProposal: GovernanceProposal | null;
  // Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedProposal: (proposal: GovernanceProposal | null) => void;
  // Data actions
  fetchProposals: () => Promise<void>;
  fetchUserVotes: (userId: number) => Promise<void>;
  submitProposal: (proposal: Omit<GovernanceProposal, 'id' | 'created_at' | 'votes_for' | 'votes_against' | 'votes_abstain'>) => Promise<void>;
  submitVote: (proposalId: number, voteType: 'for' | 'against' | 'abstain') => Promise<void>;
  fetchStats: () => Promise<void>;
}
export const useGovernanceStore = create<GovernanceState>((set, get) => ({
  // Initial state
  proposals: [],
  activeProposals: [],
  userVotes: [],
  totalProposals: 0,
  totalVotes: 0,
  participationRate: 0,
  userParticipation: 0,
  loading: false,
  error: null,
  selectedProposal: null,
  // Basic actions
  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: string | null) => set({ error }),
  setSelectedProposal: (proposal: GovernanceProposal | null) => set({ selectedProposal: proposal }),
  // Fetch proposals
  fetchProposals: async () => {
    const { setLoading, setError } = get();
    try {
      setLoading(true);
      setError(null);
      // Mode développement - simulation
      if (process.env.NODE_ENV === 'development') {
        await new Promise(resolve => setTimeout(resolve, 800));
        const mockProposals: GovernanceProposal[] = [
          {
            id: 1,
            title: "Amélioration de l'interface utilisateur",
            description: "Proposition d'améliorer l'interface utilisateur avec de nouvelles fonctionnalités d'accessibilité et un design plus moderne. Cette proposition inclut l'ajout d'un mode sombre, l'amélioration de la navigation mobile et l'optimisation des performances.",
            author_id: 1,
            status: 'active',
            votes_for: 127,
            votes_against: 23,
            votes_abstain: 8,
            created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            voting_deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 2,
            title: "Intégration de nouvelles fonctionnalités IA",
            description: "Proposition d'intégrer de nouveaux modèles d'IA plus performants et d'ajouter des fonctionnalités de personnalisation avancée pour améliorer l'expérience utilisateur.",
            author_id: 2,
            status: 'active',
            votes_for: 89,
            votes_against: 45,
            votes_abstain: 12,
            created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            voting_deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 3,
            title: "Redistribution des bénéfices Q4",
            description: "Proposition de redistribution des bénéfices du quatrième trimestre selon le modèle coopératif : 40% réinvestissement, 35% redistribution membres, 25% réserves.",
            author_id: 3,
            status: 'passed',
            votes_for: 234,
            votes_against: 12,
            votes_abstain: 5,
            created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            voting_deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 4,
            title: "Politique de confidentialité mise à jour",
            description: "Mise à jour de la politique de confidentialité pour se conformer aux nouvelles réglementations européennes et améliorer la transparence sur l'utilisation des données.",
            author_id: 1,
            status: 'draft',
            votes_for: 0,
            votes_against: 0,
            votes_abstain: 0,
            created_at: new Date().toISOString(),
            voting_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ];
        const activeProposals = mockProposals.filter(p => p.status === 'active');
        set({
          proposals: mockProposals,
          activeProposals,
          totalProposals: mockProposals.length,
        });
        return;
      }
      // Mode production - vraie API
      const response = await authenticatedFetch(
        `${API_ENDPOINTS.governance.base}${API_ENDPOINTS.governance.proposals}`
      );
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des propositions');
      }
      const result = await response.json();
      const proposals = result.data || [];
      const activeProposals = proposals.filter((p: GovernanceProposal) => p.status === 'active');
      set({
        proposals,
        activeProposals,
        totalProposals: proposals.length,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur de chargement';
      setError(message);
    } finally {
      setLoading(false);
    }
  },
  // Fetch user votes
  fetchUserVotes: async (userId: number) => {
    const { setError } = get();
    try {
      setError(null);
      // Mode développement - simulation
      if (process.env.NODE_ENV === 'development') {
        const mockVotes: Vote[] = [
          {
            id: 1,
            proposal_id: 1,
            user_id: userId,
            vote_type: 'for',
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 2,
            proposal_id: 3,
            user_id: userId,
            vote_type: 'for',
            created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ];
        set({
          userVotes: mockVotes,
          userParticipation: 75, // 75% de participation
        });
        return;
      }
      // Mode production - vraie API
      const response = await authenticatedFetch(
        `${API_ENDPOINTS.governance.base}${API_ENDPOINTS.governance.votes}?user_id=${userId}`
      );
      if (response.ok) {
        const result = await response.json();
        set({ userVotes: result.data || [] });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur de chargement des votes';
      setError(message);
    }
  },
  // Submit new proposal
  submitProposal: async (proposalData) => {
    const { setLoading, setError, fetchProposals } = get();
    try {
      setLoading(true);
      setError(null);
      // Mode développement - simulation
      if (process.env.NODE_ENV === 'development') {
        await new Promise(resolve => setTimeout(resolve, 1500));
        // Simuler la création réussie
        await fetchProposals();
        return;
      }
      // Mode production - vraie API
      const response = await authenticatedFetch(
        `${API_ENDPOINTS.governance.base}${API_ENDPOINTS.governance.proposals}`,
        {
          method: 'POST',
          body: JSON.stringify(proposalData),
        }
      );
      if (!response.ok) {
        throw new Error('Erreur lors de la soumission de la proposition');
      }
      await fetchProposals();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur de soumission';
      setError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  },
  // Submit vote
  submitVote: async (proposalId: number, voteType: 'for' | 'against' | 'abstain') => {
    const { setLoading, setError, fetchProposals } = get();
    try {
      setLoading(true);
      setError(null);
      // Mode développement - simulation
      if (process.env.NODE_ENV === 'development') {
        await new Promise(resolve => setTimeout(resolve, 800));
        // Simuler le vote réussi
        await fetchProposals();
        return;
      }
      // Mode production - vraie API
      const response = await authenticatedFetch(
        `${API_ENDPOINTS.governance.base}${API_ENDPOINTS.governance.votes}`,
        {
          method: 'POST',
          body: JSON.stringify({
            proposal_id: proposalId,
            vote_type: voteType,
          }),
        }
      );
      if (!response.ok) {
        throw new Error('Erreur lors du vote');
      }
      await fetchProposals();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur de vote';
      setError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  },
  // Fetch stats
  fetchStats: async () => {
    const { setError } = get();
    try {
      setError(null);
      // Mode développement - simulation
      if (process.env.NODE_ENV === 'development') {
        set({
          totalVotes: 1247,
          participationRate: 78,
        });
        return;
      }
      // Mode production - vraie API
      const response = await authenticatedFetch(
        `${API_ENDPOINTS.governance.base}${API_ENDPOINTS.governance.stats}`
      );
      if (response.ok) {
        const result = await response.json();
        set({
          totalVotes: result.data.total_votes || 0,
          participationRate: result.data.participation_rate || 0,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur de chargement des statistiques';
      setError(message);
    }
  },
}));
export default useGovernanceStore;