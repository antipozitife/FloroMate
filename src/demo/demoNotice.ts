import { DEMO_MODE } from '../config/api';

export const notifyDemoAction = (action: 'photo' | 'message') => {
  if (!DEMO_MODE) return;

  const detail = action === 'photo'
    ? 'Фото не отправляется на сервер. Приложение покажет заранее подготовленный пример результата.'
    : 'Сообщение не отправляется внешнему сервису. Ответ будет сформирован из демонстрационных данных.';

  window.alert(`ℹ️ FloroMate работает в деморежиме.\n\n${detail}`);
};
