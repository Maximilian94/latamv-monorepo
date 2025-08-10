import { Collapse, Grid2 } from '@mui/material';
import { useState } from 'react';
import { TransitionGroup } from 'react-transition-group';
import Typewriter from 'typewriter-effect';
import { CreateAccountForm } from './create-account';
import { UseFormReturn } from 'react-hook-form';
import { Subsidiary } from './create-account';
import { Card } from '../../components/card';

export const Review = ({
  accountForm,
  subsidiaries,
  selectedSubsidiary,
}: {
  accountForm: UseFormReturn<CreateAccountForm>;
  subsidiaries: Subsidiary[];
  selectedSubsidiary: Subsidiary | null;
}) => {
  const [review, setReview] = useState<number[]>([0]);

  const formValues = accountForm.watch();
  const selectedSubsidiaryName =
    subsidiaries.find((s) => s.id === formValues.subsidiaryId)?.name ||
    'Not selected';
  const selectedBaseName =
    selectedSubsidiary?.bases.find((b) => b.id === formValues.baseId)?.city ||
    'Not selected';

  return (
    <div className="flex flex-col gap-6 text-center">
      <TransitionGroup>
        {review.map((_, index) => (
          <Collapse key={index} className="m-4">
            {index === 0 && (
              <span className="text-2xl mb-4">
                <Typewriter
                  options={{
                    delay: 20,
                    cursor: '',
                  }}
                  onInit={(typewriter) => {
                    typewriter
                      .start()
                      .typeString('Review Your Information')
                      .pauseFor(500)
                      .callFunction(() => {
                        setReview([...review, 1]);
                      })
                      .start();
                  }}
                />
              </span>
            )}
            {index === 1 && (
              <Grid2 container spacing={2}>
                {/* Personal Information */}
                <Grid2 size={12}>
                <Card>
                <div className="flex flex-col gap-2 rounded-lg">
                  <span className="text-lg font-semibold text-white">
                    Personal Information
                  </span>

                  <div className="space-y-2 text-sm">
                    <div className="flex flex-row gap-2">
                      <span className="font-medium">Username:</span>
                      <span>
                        <Typewriter
                          options={{
                            delay: 20,
                            cursor: '',
                          }}
                          onInit={(typewriter) => {
                            typewriter
                              .start()
                              .pauseFor(500)
                              .typeString(`${formValues.userName}`);
                          }}
                        />
                      </span>
                    </div>

                    <div className="flex flex-row gap-2">
                      <span className="font-medium">Name:</span>
                      <span>
                        <Typewriter
                          options={{
                            delay: 20,
                            cursor: '',
                          }}
                          onInit={(typewriter) => {
                            typewriter
                              .start()
                              .pauseFor(500)
                              .typeString(
                                `${formValues.firstName} ${formValues.lastName}`
                              );
                          }}
                        />
                      </span>
                    </div>

                    <div className="flex flex-row gap-2">
                      <span className="font-medium">Email:</span>
                      <span>
                        <Typewriter
                          options={{
                            delay: 20,
                            cursor: '',
                          }}
                          onInit={(typewriter) => {
                            typewriter
                              .start()
                              .pauseFor(500)
                              .typeString(`${formValues.email}`);
                          }}
                        />
                      </span>
                    </div>
                  </div>
                </div>
                </Card>
                </Grid2>
                

                {/* LATAM Information */}
                <Grid2 size={6}>
                <Card>
                <div className="flex flex-col gap-2 rounded-lg">
                  <span className="text-lg font-semibold text-white">
                    LATAM Information
                  </span>

                  <div className="space-y-2 text-sm">
                    <div className="flex flex-row gap-2">
                      <span className="font-medium">Subsidiary:</span>{' '}
                      <span>
                        <Typewriter
                          options={{
                            delay: 20,
                            cursor: '',
                          }}
                          onInit={(typewriter) => {
                            typewriter
                              .start()
                              .pauseFor(500)
                              .typeString(`${selectedSubsidiaryName}`);
                          }}
                        />
                      </span>
                    </div>

                    <div className="flex flex-row gap-2">
                      <span className="font-medium">Base:</span>{' '}
                      <span>
                        <Typewriter
                          options={{
                            delay: 20,
                            cursor: '',
                          }}
                          onInit={(typewriter) => {
                            typewriter
                              .start()
                              .pauseFor(500)
                              .typeString(`${selectedBaseName}`);
                          }}
                        />
                      </span>
                    </div>
                  </div>
                </div>
                </Card>
                </Grid2>
                
                

                {/* Online Flying */}
                <Grid2 size={6}>
                <Card>
                <div className="flex flex-col gap-2 rounded-lg">
                  <div className="flex flex-col gap-2">
                    <span className="text-lg font-semibold text-white">
                      Online Flying
                    </span>

                    <div className="space-y-2 text-sm">
                      <div className="flex flex-row gap-2">
                        <span className="font-medium">IVAO ID:</span>{' '}
                        <span>
                          <Typewriter
                            options={{
                              delay: 20,
                              cursor: '',
                            }}
                            onInit={(typewriter) => {
                              typewriter
                                .start()
                                .pauseFor(500)
                                .typeString(
                                  `${formValues.ivaoId || 'Not provided'}`
                                );
                            }}
                          />
                        </span>
                      </div>

                      <div className="flex flex-row gap-2">
                        <span className="font-medium">VATSIM ID:</span>{' '}
                        <span>
                          <Typewriter
                            options={{
                              delay: 20,
                              cursor: '',
                            }}
                            onInit={(typewriter) => {
                              typewriter
                                .start()
                                .pauseFor(500)
                                .typeString(
                                  `${formValues.vatsimId || 'Not provided'}`
                                );
                            }}
                          />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                </Card>
                </Grid2>
                
                
              </Grid2>
            )}
          </Collapse>
        ))}
      </TransitionGroup>

      <div className="mt-4 text-sm text-gray-300">
        Please review your information above. If everything looks correct, click
        "Create Account" to complete your registration.
      </div>
    </div>
  );
};
