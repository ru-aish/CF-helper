import { useEffect, useState } from 'react';
import { Joyride, STATUS, Step } from 'react-joyride';

export function Tour() {
  const [run, setRun] = useState(false);

  useEffect(() => {
    // Check local storage to see if the user has already completed the tour
    const hasCompletedTour = localStorage.getItem('hasCompletedTour');
    if (!hasCompletedTour) {
      // Small delay to ensure all DOM elements are mounted before tour starts
      const timer = setTimeout(() => {
        setRun(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const steps: Step[] = [
    {
      target: '.tour-new-problem',
      content: 'Start a new session by pasting a Codeforces problem URL here.',
      // disableBeacon: true,
      placement: 'right',
    },
    {
      target: '.tour-api-key',
      content: 'Make sure to configure your API key for the AI to work properly.',
      placement: 'bottom',
    },
    {
      target: '.tour-chat-input',
      content: 'Ask for hints or get the full solution here once a problem is loaded.',
      placement: 'top',
    },
  ];

  const handleJoyrideCallback = (data: any) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      // Save to localStorage so it doesn't show again
      localStorage.setItem('hasCompletedTour', 'true');
      setRun(false);
    }
  };

  return (
    <Joyride {...({ callback: handleJoyrideCallback } as any)}

      continuous={true}
      run={run}
      scrollToFirstStep={true}
      showProgress={true}
      showSkipButton={true}
      steps={steps}
      styles={{
        tooltip: {
          backgroundColor: '#1e1e1e',
          color: '#f3f4f6',
        },
        buttonNext: {
          backgroundColor: '#3b82f6',
        },
        buttonBack: {
          color: '#9ca3af',
        },
        buttonSkip: {
          color: '#9ca3af',
        },
        options: {
          arrowColor: '#2d2d2d',
          backgroundColor: '#1e1e1e',
          overlayColor: 'rgba(0, 0, 0, 0.6)',
          primaryColor: '#3b82f6',
          textColor: '#f3f4f6',
          zIndex: 1000,
        }
      } as any}
    />
  );
}
