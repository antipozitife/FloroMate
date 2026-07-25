import React, { useState, useEffect } from 'react';
import './FeedBack.css';
import { apiUrl } from '../../config/api';

interface FeedbackItem {
  id: number;
  authorName?: string;
  name?: string;
  authorRole?: string;
  comment?: string;
  message?: string;
  rating?: number;
  email?: string;
  createdAt: string;
}

const Feedback: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load feedbacks from database
  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const response = await fetch(apiUrl('/api/feedback'));
      if (!response.ok) {
        throw new Error('Failed to fetch feedbacks');
      }

      const data: FeedbackItem[] = await response.json();
      console.log('📋 Feedbacks loaded:', data);
      setFeedbacks(data);
      setError(null);
    } catch (err) {
      console.error('❌ Error fetching feedbacks:', err);
      setError('Failed to load reviews');

      // Fallback reviews if database is unavailable
      setFeedbacks([
        {
          id: 1,
          authorName: 'Elena',
          comment: 'FloroMate helped me identify a rare plant from my vacation! The recognition is very accurate.',
          rating: 5,
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          authorName: 'Maxim',
          comment: 'Saved my favorite plant thanks to the disease diagnosis feature. The recommendations were incredibly helpful!',
          rating: 5,
          createdAt: new Date().toISOString()
        },
        {
          id: 3,
          authorName: 'Anna',
          comment: 'The landscape designer constructor helped plan my dream garden. The result exceeded my expectations!',
          rating: 5,
          createdAt: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getAuthorName = (feedback: FeedbackItem): string => {
    return feedback.authorName || feedback.name || 'User';
  };

  const getComment = (feedback: FeedbackItem): string => {
    return feedback.comment || feedback.message || '';
  };

  const renderStars = (rating?: number) => {
    if (!rating) return '⭐⭐⭐⭐⭐';
    const stars = Array.from({ length: rating }).map(() => '⭐').join('');
    return stars;
  };

  if (loading) {
    return (
      <section className="testimonials">
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
          <p>Loading reviews...</p>
        </div>
      </section>
    );
  }

  if (feedbacks.length === 0 && !error) {
    return null;
  }

  // Duplicate feedbacks for infinite scroll effect
  const duplicatedFeedbacks = feedbacks.length > 0 ? [...feedbacks, ...feedbacks] : feedbacks;

  return (
    <section className="testimonials">
      <h2 className="section-title">Отзывы пользователей</h2>
      
      <div className="testimonials-carousel-wrapper">
        <div className="testimonials-carousel-track">
          {duplicatedFeedbacks.map((feedback, index) => (
            <div key={index} className="testimonial-card testimonial-carousel-card">
              <div className="stars">{renderStars(feedback.rating)}</div>
              <p className="testimonial-text">"{getComment(feedback)}"</p>
              <p className="testimonial-author">— {getAuthorName(feedback)}</p>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ textAlign: 'center', color: '#d32f2f', marginTop: '20px' }}>
          <p>{error}</p>
        </div>
      )}
    </section>
  );
};

export default Feedback;
