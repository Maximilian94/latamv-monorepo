import { Button, Collapse } from '@mui/material';
import { useState } from 'react';
import Typewriter from 'typewriter-effect';
import { TransitionGroup } from 'react-transition-group';

export const RegistrationComplete = ({navigateToPilotDashboard}: {navigateToPilotDashboard: () => void}) => {
  
  const WORDS = [
    'Your pilot profile is now active',
    'Your career at LATAM Virtual begins now',
  ];
  const [words, setWords] = useState<string[]>([WORDS[0]]);
  const [showButton, setShowButton] = useState(false);


  const handleNext = () => {
    if (words.length < WORDS.length) {
        console.log('handleNext - dentro', words.length);
      setWords([...words, WORDS[words.length]]);
    }
  };

  return (
    <div>
      <TransitionGroup>
        {words.map((word, index) => (
          <Collapse key={index} className="m-4">

              <span className="text-2xl mb-4">
                <Typewriter
                  options={{
                    delay: 20,
                    cursor: '',
                  }}
                  onInit={(typewriter) => {
                    typewriter
                      .start()
                      .typeString(word)
                      .pauseFor(500)
                      .callFunction(() => {
                        console.log('words.length', words.length);
                        if (words.length === 2) {
                          setShowButton(true);
                        } else {
                          handleNext();
                        }
                      })
                      .start();
                  }}
                />
              </span>
            
          </Collapse>
        ))}

        <Collapse
          in={showButton}
          easing={{
            enter: 'ease-in-out',
            exit: 'ease-in-out',
          }}
        >
          {showButton && (
            <Button variant="contained" color="secondary" onClick={navigateToPilotDashboard}>
              Proceed to Pilot Dashboard
            </Button>
          )}
        </Collapse>
      </TransitionGroup>
    </div>
  );
};
