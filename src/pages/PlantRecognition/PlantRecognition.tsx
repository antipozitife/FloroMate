import React, { useState, ChangeEvent, FormEvent, useRef } from 'react';
import './PlantRecognition.css';
import { addRecognizedPlant } from '../Encyclopedia/plantApi';
import { apiUrl } from '../../config/api';

interface PlantResult {
  species?: {
    commonNames?: string[];
    scientificNameWithoutAuthor?: string;
  };
  genus?: {
    scientificNameWithoutAuthor?: string;
  };
  family?: {
    scientificNameWithoutAuthor?: string;
  };
  score: number;
}

interface RecognitionResponse {
  results?: PlantResult[];
  error?: string;
  suggestion?: string;
}

const PlantRecognition: React.FC = () => {
  const [flowerImage, setFlowerImage] = useState<File | null>(null);
  const [leafImage, setLeafImage] = useState<File | null>(null);
  const [flowerPreview, setFlowerPreview] = useState<string | null>(null);
  const [leafPreview, setLeafPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [results, setResults] = useState<PlantResult[]>([]);
  const [bestMatch, setBestMatch] = useState<PlantResult | null>(null);

  // Создаем ref для input элементов
  const flowerInputRef = useRef<HTMLInputElement>(null);
  const leafInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (
    e: ChangeEvent<HTMLInputElement>,
    type: 'flower' | 'leaf'
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();

      reader.onloadend = () => {
        const preview = reader.result as string;
        if (type === 'flower') {
          setFlowerImage(file);
          setFlowerPreview(preview);
        } else {
          setLeafImage(file);
          setLeafPreview(preview);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const getPlantName = (plant: PlantResult): string => {
    if (plant.species?.commonNames && plant.species.commonNames.length > 0) {
      return plant.species.commonNames[0];
    }
    if (plant.species?.scientificNameWithoutAuthor) {
      return plant.species.scientificNameWithoutAuthor;
    }
    if (plant.genus?.scientificNameWithoutAuthor) {
      return plant.genus.scientificNameWithoutAuthor;
    }
    return 'Неизвестное растение';
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!flowerImage && !leafImage) {
      setStatus({ message: '❌ Пожалуйста, загрузите хотя бы одно изображение', type: 'error' });
      return;
    }
  
    setLoading(true);
    setStatus({ message: '🔍 Анализируем растение...', type: 'info' });
    
    try {
      const formData = new FormData();
      if (flowerImage) formData.append('flower', flowerImage);
      if (leafImage) formData.append('leaf', leafImage);
  
      // Шаг 1: Распознавание через PlantNet
      const response = await fetch(apiUrl('/api/identify'), {
        method: 'POST',
        body: formData,
      });
  
      if (!response.ok) {
        throw new Error(`Ошибка: ${response.status}`);
      }
  
      const data: RecognitionResponse = await response.json();
  
      if (data.error) {
        throw new Error(data.error);
      }
  
      if (data.results && data.results.length > 0) {
        const sorted = [...data.results].sort((a, b) => b.score - a.score);
        
        // Шаг 2: Переводим ВСЕ результаты через Groq
        setStatus({ message: '🤖 Переводим на русский...', type: 'info' });
        
        const translationPromises = sorted.map(async (result) => {
          const scientificName = result.species?.scientificNameWithoutAuthor || 
                                result.genus?.scientificNameWithoutAuthor || 
                                'Unknown';
          
          try {
            const enrichResponse = await fetch(apiUrl('/api/plants/enrich'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ scientificName })
            });
            
            if (enrichResponse.ok) {
              const enrichData = await enrichResponse.json();
              
              if (enrichData.data && enrichData.data.name) {
                if (!result.species) result.species = {};
                result.species.commonNames = [
                  enrichData.data.name,
                  enrichData.data.commonName
                ].filter(Boolean);
              }
            }
          } catch (enrichError) {
            console.warn('Не удалось перевести:', scientificName);
          }
          
          return result;
        });
        
        // Ждем завершения всех переводов
        const translatedResults = await Promise.all(translationPromises);
        
        setResults(translatedResults);
        setBestMatch(translatedResults[0]);
        setStatus({ message: '✅ Растение определено! Сохраняем в базу данных...', type: 'info' });
        
        // Шаг 3: Сохраняем лучшее совпадение в базу данных
        const bestResult = translatedResults[0];
        const scientificName = bestResult.species?.scientificNameWithoutAuthor || 
                              bestResult.genus?.scientificNameWithoutAuthor;
        
        if (scientificName && scientificName !== 'Unknown') {
          try {
            await addRecognizedPlant({
              scientificName: scientificName,
              genus: bestResult.genus?.scientificNameWithoutAuthor,
              family: bestResult.family?.scientificNameWithoutAuthor,
              confidence: bestResult.score
            });
            setStatus({ message: '✅ Растение определено и добавлено в энциклопедию!', type: 'success' });
          } catch (saveError) {
            console.error('Ошибка при сохранении растения:', saveError);
            setStatus({ 
              message: '✅ Растение определено, но не удалось добавить в базу данных', 
              type: 'error' 
            });
          }
        } else {
          setStatus({ message: '✅ Растение определено!', type: 'success' });
        }
      } else {
        setStatus({ message: '🤔 Не удалось определить растение', type: 'info' });
      }
  
    } catch (error) {
      setStatus({
        message: `❌ Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };
  
  
  const handleReset = () => {
    setFlowerImage(null);
    setLeafImage(null);
    setFlowerPreview(null);
    setLeafPreview(null);
    setStatus(null);
    setResults([]);
    setBestMatch(null);
    
    // Очищаем input элементы
    if (flowerInputRef.current) flowerInputRef.current.value = '';
    if (leafInputRef.current) leafInputRef.current.value = '';
  };

  return (
    <div className="plant-recognition-page">
      {/* Декоративные элементы */}
      <div className="decorative-plants">
        <div className="deco-plant deco-1">🌿</div>
        <div className="deco-plant deco-2">🌾</div>
        <div className="deco-plant deco-3">🍃</div>
      </div>

      <div className="recognition-wrapper">
        <div className="recognition-container">
          {/* Header */}
          <div className="recognition-header">
            <h1 className="page-title">📸 Распознавание растений</h1>
            <p className="page-subtitle">
              Загрузите фото цветка или листа — мы определим растение за секунду
            </p>
          </div>

          {/* Form Section */}
          <form className="recognition-form" onSubmit={handleSubmit}>
            <div className="form-container">
              {/* Flower Upload */}
              <div className="upload-group">
                <label className="upload-label">
                  <span className="label-icon">🌸</span>
                  Фото цветка
                </label>
                <div
                  className="file-input-wrapper"
                  onClick={() => flowerInputRef.current?.click()}
                >
                  <input
                    ref={flowerInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e, 'flower')}
                    disabled={loading}
                    className="file-input"
                  />
                  {!flowerPreview ? (
                    <div className="file-input-placeholder">
                      <span className="placeholder-icon">📷</span>
                      <span className="placeholder-text">Выбрать фото</span>
                    </div>
                  ) : (
                    <>
                      <div className="image-preview">
                        <img src={flowerPreview} alt="Flower preview" />
                        <div className="preview-badge">✓</div>
                      </div>
                      {flowerImage && <div className="file-name">{flowerImage.name}</div>}
                    </>
                  )}
                </div>
              </div>

              {/* Leaf Upload */}
              <div className="upload-group">
                <label className="upload-label">
                  <span className="label-icon">🍃</span>
                  Фото листа
                </label>
                <div
                  className="file-input-wrapper"
                  onClick={() => leafInputRef.current?.click()}
                >
                  <input
                    ref={leafInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e, 'leaf')}
                    disabled={loading}
                    className="file-input"
                  />
                  {!leafPreview ? (
                    <div className="file-input-placeholder">
                      <span className="placeholder-icon">📷</span>
                      <span className="placeholder-text">Выбрать фото</span>
                    </div>
                  ) : (
                    <>
                      <div className="image-preview">
                        <img src={leafPreview} alt="Leaf preview" />
                        <div className="preview-badge">✓</div>
                      </div>
                      {leafImage && <div className="file-name">{leafImage.name}</div>}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="button-group">
            <button type="submit" className="btn-identify" disabled={loading || (!flowerImage && !leafImage)}>
  {loading ? '⏳ Анализируем и переводим...' : '🔬 Определить растение'}
</button>

              <button
                type="button"
                className="btn-reset"
                onClick={handleReset}
                disabled={loading}
              >
                🔄 Сбросить
              </button>
            </div>
          </form>

          {/* Status Message */}
          {status && (
            <div className={`status-message status-${status.type}`}>
              {status.message}
            </div>
          )}

          {/* Results */}
          {bestMatch && (
            <>
              <div className="best-match-section">
                <h2 className="result-title">🎯 Наиболее вероятный результат</h2>
                <div className="best-match-card">
                  <div className="match-name">{getPlantName(bestMatch)}</div>

                  {bestMatch.species?.scientificNameWithoutAuthor && (
                    <div className="match-info">
                      <span className="info-label">Научное название:</span>
                      <span className="info-value scientific">
                        {bestMatch.species.scientificNameWithoutAuthor}
                      </span>
                    </div>
                  )}

                  {bestMatch.genus?.scientificNameWithoutAuthor && (
                    <div className="match-info">
                      <span className="info-label">Род:</span>
                      <span className="info-value">{bestMatch.genus.scientificNameWithoutAuthor}</span>
                    </div>
                  )}

                  {bestMatch.family?.scientificNameWithoutAuthor && (
                    <div className="match-info">
                      <span className="info-label">Семейство:</span>
                      <span className="info-value">{bestMatch.family.scientificNameWithoutAuthor}</span>
                    </div>
                  )}

                  <div className="confidence-section">
                    <span className="confidence-label">Уверенность:</span>
                    <div className="confidence-bar-container">
                      <div
                        className="confidence-bar"
                        style={{ width: `${bestMatch.score * 100}%` }}
                      >
                        <span className="confidence-text">
                          {(bestMatch.score * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {results.length > 1 && (
                <div className="other-results-section">
                  <h2 className="result-title">📋 Другие варианты</h2>
                  <div className="results-list">
                    {results.slice(1).map((plant, idx) => (
                      <div key={idx} className="result-item">
                        <span className="result-rank">#{idx + 2}</span>
                        <div className="result-content">
                          <div className="result-name">{getPlantName(plant)}</div>
                          {plant.species?.scientificNameWithoutAuthor && (
                            <div className="result-scientific">
                              {plant.species.scientificNameWithoutAuthor}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="result-confidence">
                            {(plant.score * 100).toFixed(1)}%
                          </div>
                          <div className="confidence-mini-bar">
                            <div
                              className="confidence-mini-fill"
                              style={{ width: `${plant.score * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlantRecognition;
