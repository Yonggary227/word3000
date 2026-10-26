import { useEffect, useState } from 'react';

import { Seg } from '@/components/Seg';
import { isPushOn, turnPushOff, turnPushOn } from '@/lib/push';

// '단어 알림' 끔/켬. 켜면 9시~22시 매 정각에 안 외운 단어 하나가 알림으로 온다.
export function PushToggle() {
  const [on, setOn] = useState(() => {
    try {
      return localStorage.getItem('w3000.notify') === 'on';
    } catch {
      return false;
    }
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    isPushOn().then(setOn).catch(() => {});
  }, []);

  const change = async (v: 'on' | 'off') => {
    if (busy || (v === 'on') === on) return;
    setBusy(true);
    try {
      if (v === 'on') {
        await turnPushOn();
        setOn(true);
        window.alert('알림을 켰어요. 확인용으로 단어 하나를 바로 보냈어요.\n앞으로 9시~22시 매 정각에 단어가 와요.');
      } else {
        await turnPushOff();
        setOn(false);
      }
    } catch (e) {
      const denied = e instanceof Error && e.message === 'denied';
      window.alert(
        denied
          ? '알림이 허용되지 않았어요. 아이폰 설정 → 알림 → 단어 3000에서 알림을 허용한 뒤 다시 켜 주세요.'
          : '알림을 켜지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Seg
      value={on ? 'on' : 'off'}
      onChange={change}
      items={[
        { value: 'off', label: '끔' },
        { value: 'on', label: '켬' },
      ]}
    />
  );
}
