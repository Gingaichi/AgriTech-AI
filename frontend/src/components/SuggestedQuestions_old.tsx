import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LeafIcon, WaterDropIcon, FlaskIcon, PlantIcon } from '../ui/svgs';
import { apiService } from '../utils/api';

interface SuggestedQuestion {
  id: string;
  question: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
}

interface SuggestedQuestionsProps {
  onQuestionSelect?: (question: string) => void;
}

const SuggestedQuestions: React.FC<SuggestedQuestionsProps> = ({ onQuestionSelect }) => {
  const [questions, setQuestions] = useState<SuggestedQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Icon mapping for different question categories
  const getIconForQuestion = (question: string): React.ComponentType<{ className?: string }> => {
    const lowerQ = question.toLowerCase();
    if (lowerQ.includes('water') || lowerQ.includes('irrigation') || lowerQ.includes('drought')) {
      return WaterDropIcon;
    } else if (lowerQ.includes('fertilizer') || lowerQ.includes('nutrient') || lowerQ.includes('soil')) {
      return FlaskIcon;
    } else if (lowerQ.includes('pest') || lowerQ.includes('disease') || lowerQ.includes('control')) {
      return LeafIcon;
    } else {
      return PlantIcon;
    }
  };

  // Fallback questions if API fails
  const fallbackQuestions: SuggestedQuestion[] = [
    {
      id: '1',
      question: 'What is the best time to plant maize in Malawi?',
      icon: PlantIcon,
      category: 'planting'
    },
    {
      id: '2',
      question: 'How can I protect my crops from fall armyworm?',
      icon: LeafIcon,
      category: 'pest_control'
    },
    {
      id: '3',
      question: 'What fertilizers work best for groundnuts in sandy soil?',
      icon: FlaskIcon,
      category: 'fertilizer'
    },
    {
      id: '4',
      question: 'How much water does tobacco need during dry season?',
      icon: WaterDropIcon,
      category: 'irrigation'
    },
    {
      id: '5',
      question: 'When should I harvest my maize for best yield?',
      icon: PlantIcon,
      category: 'harvesting'
    },
    {
      id: '6',
      question: 'How to prepare soil for cassava planting?',
      icon: LeafIcon,
      category: 'soil_preparation'
    }
  ];

  // Load fallback questions
  const loadFallbackQuestions = () => {
    const shuffled = [...fallbackQuestions].sort(() => 0.5 - Math.random());
    setQuestions(shuffled.slice(0, 3));
  };

  // Fetch questions from API
  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiQuestions = await apiService.getSuggestedQuestions();
      const formattedQuestions: SuggestedQuestion[] = apiQuestions
        .slice(0, 12)
        .map((q, index) => ({
          id: `api_${index}`,
          question: q,
          icon: getIconForQuestion(q),
          category: 'agriculture'
        }));
      
      // Shuffle and select 3 random questions
      const shuffled = [...formattedQuestions].sort(() => 0.5 - Math.random());
      setQuestions(shuffled.slice(0, 3));
    } catch (err) {
      console.error('Failed to fetch suggested questions:', err);
      setError('Failed to load suggested questions');
      loadFallbackQuestions();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleQuestionClick = async (question: string) => {
    if (onQuestionSelect) {
      onQuestionSelect(question);
    } else {
      try {
        setLoading(true);
        const chat = await apiService.createChat({
          message: question,
        });
        navigate(`/chat/${chat.id}`);
      } catch (error) {
        console.error('Failed to create chat:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const refreshQuestions = () => {
    fetchQuestions();
  };

  if (loading && questions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Suggested Questions</h2>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Suggested Questions</h2>
        <button
          onClick={refreshQuestions}
          disabled={loading}
          className="text-sm text-emerald-600 hover:text-emerald-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-700">{error}</p>
        </div>
      )}

      <div className="space-y-3">
        {questions.map((item) => {
          const IconComponent = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => handleQuestionClick(item.question)}
              disabled={loading}
              className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 p-2 rounded-lg bg-emerald-100 group-hover:bg-emerald-200 transition-colors">
                  <IconComponent className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 group-hover:text-emerald-700 leading-relaxed">
                    {item.question}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SuggestedQuestions;
