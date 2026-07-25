import React, { useState, useEffect } from 'react';
import PixelTransition from '../components/PixelTransition/PixelTransition';
import alinaPhoto from '../assets/team/alina.jpg';
import dilyaraPhoto from '../assets/team/dilyara.jpg';
import artemPhoto from '../assets/team/artem.jpg';
import './OurTeam.css';
import { apiUrl } from '../config/api';

const OurTeam: React.FC = () => {
  // Скроллим вверх при загрузке страницы
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  const [feedbackForm, setFeedbackForm] = useState({
    name: '',
    email: '',
    message: '',
    rating: '',
    suggestions: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const teamMembers = [
    {
      name: 'Гарипова Алина',
      role: 'Фулл-стэк разработчик',
      description: 'Фулл-стэк разработчик с колоссальным стажем, ключевой бэкэнд и AI-разработчик нашей команды. Алина отвечает за архитектуру серверной части, интеграцию AI-моделей и создание надежных решений для обработки данных. Её опыт позволяет нам создавать масштабируемые системы, которые работают стабильно даже под высокой нагрузкой.',
      photo: alinaPhoto,
      quote: 'Убери тут собаку и поставь колодец как в деревнях бывает.',
    },
    {
      name: 'Абдуллина Диляра',
      role: 'Главный дизайнер и разработчик',
      description: 'Опытнейший разработчик и главный дизайнер нашей команды, ведущий специалист по бэкэнду. Диляра создает не только красивые интерфейсы, но и продумывает каждую деталь пользовательского опыта. Её работы сочетают эстетику и функциональность, делая наши продукты интуитивно понятными и приятными в использовании.',
      photo: dilyaraPhoto,
      quote: 'Надо чтобы много было, любой каприз реализован.',
    },
    {
      name: 'Синцов Артём',
      role: 'Глава отдела AI и фронтенд-разработчик',
      description: 'Глава отдела по работе с AI и создатель важных фронтенд решений. Артём специализируется на интеграции искусственного интеллекта в пользовательские интерфейсы, создавая инновационные решения для взаимодействия с AI-моделями. Его подход к разработке позволяет нам создавать продукты, которые не просто работают, а действительно помогают пользователям.',
      photo: artemPhoto,
      quote: 'Как правильно закоммитить?',
    },
  ];

  const handleFeedbackChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFeedbackForm(prev => ({ ...prev, [name]: value }));
    if (submitStatus) {
      setSubmitStatus(null);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!feedbackForm.message.trim() || feedbackForm.message.trim().length < 10) {
      setSubmitStatus({ type: 'error', message: 'Пожалуйста, напишите сообщение (минимум 10 символов)' });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await fetch(apiUrl('/api/feedback'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: feedbackForm.name || null,
          email: feedbackForm.email || null,
          message: feedbackForm.message,
          rating: feedbackForm.rating ? parseInt(feedbackForm.rating) : null, // ✅
          suggestions: feedbackForm.suggestions || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при отправке');
      }

      setSubmitStatus({ type: 'success', message: data.message || 'Спасибо за вашу обратную связь!' });
      setFeedbackForm({
        name: '',
        email: '',
        message: '',
        rating: '',
        suggestions: '',
      });
    } catch (error) {
      console.error('Ошибка отправки обратной связи:', error);
      setSubmitStatus({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Произошла ошибка при отправке. Попробуйте позже.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="our-team-page">
      <div className="team-container">
        <div className="team-header">
          <h1>Наша команда</h1>
          <p className="team-subtitle">
            Знакомьтесь с людьми, которые создают FloroMate. Мы объединили опыт, 
            креативность и страсть к технологиям, чтобы помочь вам создавать 
            красивые и функциональные ландшафтные решения.
          </p>
        </div>

        <div className="team-grid">
          {teamMembers.map((member, index) => (
            <div key={index} className="team-card">
              <div className="team-card-image">
                <PixelTransition
                  firstContent={
                    <img
                      src={member.photo}
                      alt={member.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  }
                  secondContent={
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'grid',
                        placeItems: 'center',
                        backgroundColor: '#93A267',
                        padding: '20px',
                      }}
                    >
                      <p style={{ 
                        fontWeight: 900, 
                        fontSize: '1.5rem', 
                        color: '#ffffff',
                        textAlign: 'center',
                        lineHeight: '1.4',
                      }}>
                        {member.quote}
                      </p>
                    </div>
                  }
                  gridSize={12}
                  pixelColor="#ffffff"
                  once={false}
                  animationStepDuration={0.4}
                  aspectRatio="100%"
                  style={{ 
                    width: '100%', 
                    height: '100%',
                    border: 'none',
                    borderRadius: '0',
                    backgroundColor: 'transparent'
                  }}
                  className="custom-pixel-card"
                />
              </div>
              <div className="team-card-content">
                <h3 className="team-member-name">{member.name}</h3>
                <p className="team-member-role">{member.role}</p>
                <p className="team-member-description">{member.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Секция обратной связи */}
        <div className="team-feedback-section">
          <div className="feedback-container">
            <div className="feedback-header">
              <h2>Свяжитесь с нами</h2>
              <p className="feedback-subtitle">
                Есть вопросы или предложения? Мы всегда рады услышать ваше мнение!
              </p>
            </div>

            <div className="feedback-content">
              <div className="contact-info">
                <h3>Напишите нам</h3>
                <a href="mailto:artsint@mail.ru" className="contact-email">
                  <span className="email-icon">✉️</span>
                  <span>artsint@mail.ru</span>
                </a>
                <p className="contact-description">
                  Отправьте нам письмо, и мы обязательно ответим в ближайшее время.
                </p>
              </div>

              <div className="feedback-form-container">
                <h3>Помогите нам стать лучше</h3>
                <p className="form-description">
                  Заполните форму ниже, чтобы поделиться своими мыслями, предложениями или сообщить о проблеме.
                </p>

                <form onSubmit={handleFeedbackSubmit} className="feedback-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="feedback-name">Ваше имя (необязательно)</label>
                      <input
                        type="text"
                        id="feedback-name"
                        name="name"
                        value={feedbackForm.name}
                        onChange={handleFeedbackChange}
                        placeholder="Как к вам обращаться?"
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="feedback-email">Email (необязательно)</label>
                      <input
                        type="email"
                        id="feedback-email"
                        name="email"
                        value={feedbackForm.email}
                        onChange={handleFeedbackChange}
                        placeholder="your@email.com"
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="feedback-rating">Как бы вы оценили наш сервис? (необязательно)</label>
                    <select
                      id="feedback-rating"
                      name="rating"
                      value={feedbackForm.rating}
                      onChange={handleFeedbackChange}
                      className="form-select"
                    >
                      <option value="">Выберите оценку</option>
                      <option value="5">⭐ Отлично</option>
                      <option value="4">⭐ Хорошо</option>
                      <option value="3">⭐ Удовлетворительно</option>
                      <option value="2">⭐ Плохо</option>
                      <option value="1">⭐ Очень плохо</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="feedback-message">
                      Ваше сообщение <span className="required">*</span>
                    </label>
                    <textarea
                      id="feedback-message"
                      name="message"
                      value={feedbackForm.message}
                      onChange={handleFeedbackChange}
                      placeholder="Расскажите, что вы думаете о FloroMate, что можно улучшить, или сообщите о проблеме..."
                      className="form-textarea"
                      rows={5}
                      required
                    />
                    <small className="form-hint">Минимум 10 символов</small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="feedback-suggestions">Ваши предложения (необязательно)</label>
                    <textarea
                      id="feedback-suggestions"
                      name="suggestions"
                      value={feedbackForm.suggestions}
                      onChange={handleFeedbackChange}
                      placeholder="Что бы вы хотели видеть в FloroMate? Какие функции добавить?"
                      className="form-textarea"
                      rows={3}
                    />
                  </div>

                  {submitStatus && (
                    <div className={`submit-status ${submitStatus.type}`}>
                      {submitStatus.type === 'success' ? '✅' : '❌'} {submitStatus.message}
                    </div>
                  )}

                  <button 
                    type="submit" 
                    className="submit-button"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Отправка...' : 'Отправить'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OurTeam;
