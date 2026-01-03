import { useEffect, useRef } from 'react';

// Accessibility testing utility component
const AccessibilityTester = () => {
  const runningRef = useRef(false);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Run accessibility tests in development mode
      const runA11yTest = async () => {
        if (runningRef.current) return;
        runningRef.current = true;
        // Dynamic import to avoid build issues with axe-core
        const axeModule: any = await import('axe-core');
        const axe: any = axeModule.default;
        try {
          const results: any = await axe.run(document, {
            runOnly: {
              type: 'tag',
              values: ['wcag21aa'] // Run only WCAG 2.1 AA tests
            }
          });

          if (results.violations.length > 0) {
            console.group('%c Accessibility Violations Found', 'color: red; font-size: 16px; font-weight: bold;');
            results.violations.forEach((violation: any, index: number) => {
              console.group(`%c Violation ${index + 1}: ${violation.help}`, 'color: red; font-weight: bold;');
              console.log('%c Description:', 'font-weight: bold;', violation.description);
              console.log('%c Help URL:', 'font-weight: bold;', violation.helpUrl);
              console.log('%c Elements:', 'font-weight: bold;', violation.nodes);
              console.groupEnd();
            });
            console.groupEnd();
          } else {
            console.log('%c ✅ No accessibility violations found for WCAG 2.1 AA', 'color: green; font-weight: bold;');
          }
        } catch (err) {
          console.error('Accessibility test error:', err);
        } finally {
          runningRef.current = false;
        }
      };

      // Run accessibility tests periodically
      const interval = setInterval(runA11yTest, 30000); // Every 30 seconds in dev mode

      // Run immediately on mount
      runA11yTest();

      return () => {
        clearInterval(interval);
      };
    }

    // Explicit return for when not in development
    return () => {};
  }, []);

  return null;
};

export default AccessibilityTester;
