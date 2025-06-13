import { useState, useEffect, useCallback } from 'react';
import { TestSessionService, QuestionResponseData } from '../services/testSessionService';

interface OfflineResponse {
  sessionId: string;
  responseData: QuestionResponseData;
  timestamp: number;
}

interface UseOfflineQuestionResponsesProps {
  userId: string;
  productType: string;
  onSyncComplete?: (syncedCount: number) => void;
  onSyncError?: (error: Error) => void;
}

export const useOfflineQuestionResponses = ({
  userId,
  productType,
  onSyncComplete,
  onSyncError
}: UseOfflineQuestionResponsesProps) => {
  const [offlineResponses, setOfflineResponses] = useState<OfflineResponse[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load offline responses from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(`offline_responses_${userId}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as OfflineResponse[];
        setOfflineResponses(parsed);
      } catch (error) {
        console.error('Failed to parse stored offline responses:', error);
        localStorage.removeItem(`offline_responses_${userId}`);
      }
    }
  }, [userId]);

  // Save offline responses to localStorage
  const saveToStorage = useCallback((responses: OfflineResponse[]) => {
    try {
      localStorage.setItem(`offline_responses_${userId}`, JSON.stringify(responses));
    } catch (error) {
      console.error('Failed to save offline responses to storage:', error);
    }
  }, [userId]);

  // Add a response to the offline queue
  const addOfflineResponse = useCallback((
    sessionId: string,
    responseData: QuestionResponseData
  ) => {
    const newResponse: OfflineResponse = {
      sessionId,
      responseData,
      timestamp: Date.now()
    };

    setOfflineResponses(prev => {
      const updated = [...prev, newResponse];
      saveToStorage(updated);
      return updated;
    });

    console.log('📱 Added offline response:', {
      questionId: responseData.questionId,
      sessionId,
      queueSize: offlineResponses.length + 1
    });
  }, [offlineResponses.length, saveToStorage]);

  // Sync offline responses when online
  const syncOfflineResponses = useCallback(async () => {
    if (!isOnline || offlineResponses.length === 0 || isSyncing) {
      return;
    }

    setIsSyncing(true);
    try {
      console.log(`🔄 Syncing ${offlineResponses.length} offline responses...`);

      // Group responses by sessionId for batch processing
      const responsesBySession = offlineResponses.reduce((acc, response) => {
        if (!acc[response.sessionId]) {
          acc[response.sessionId] = [];
        }
        acc[response.sessionId].push(response);
        return acc;
      }, {} as Record<string, OfflineResponse[]>);

      // Sync each session's responses
      for (const [sessionId, responses] of Object.entries(responsesBySession)) {
        await TestSessionService.batchRecordResponses(
          userId,
          productType,
          responses.map(r => ({
            sessionId: r.sessionId,
            responseData: r.responseData
          }))
        );
      }

      // Clear synced responses
      setOfflineResponses([]);
      localStorage.removeItem(`offline_responses_${userId}`);

      console.log('✅ Successfully synced all offline responses');
      onSyncComplete?.(offlineResponses.length);

    } catch (error) {
      console.error('Failed to sync offline responses:', error);
      onSyncError?.(error as Error);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, offlineResponses, isSyncing, userId, productType, onSyncComplete, onSyncError]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && offlineResponses.length > 0) {
      // Add a small delay to ensure connection is stable
      const timer = setTimeout(() => {
        syncOfflineResponses();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isOnline, offlineResponses.length, syncOfflineResponses]);

  // Record a question response (online or offline)
  const recordQuestionResponse = useCallback(async (
    sessionId: string,
    responseData: QuestionResponseData
  ): Promise<boolean> => {
    if (isOnline) {
      try {
        await TestSessionService.recordQuestionResponse(
          userId,
          sessionId,
          productType,
          responseData
        );
        return true;
      } catch (error) {
        console.warn('Failed to record online, falling back to offline mode:', error);
        addOfflineResponse(sessionId, responseData);
        return false;
      }
    } else {
      addOfflineResponse(sessionId, responseData);
      return false;
    }
  }, [isOnline, userId, productType, addOfflineResponse]);

  // Clear all offline responses (for manual cleanup)
  const clearOfflineResponses = useCallback(() => {
    setOfflineResponses([]);
    localStorage.removeItem(`offline_responses_${userId}`);
  }, [userId]);

  return {
    isOnline,
    isSyncing,
    offlineResponseCount: offlineResponses.length,
    recordQuestionResponse,
    syncOfflineResponses,
    clearOfflineResponses,
    addOfflineResponse
  };
}; 