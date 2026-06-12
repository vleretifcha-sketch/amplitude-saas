import Image from 'next/image';

type AmplitudeLogoProps = {
  className?: string;
  priority?: boolean;
};

export function AmplitudeLogo({ className = 'h-10 w-auto', priority }: AmplitudeLogoProps) {
  return (
    <Image
      src="/amplitude-logo.jpg"
      alt="Amplitude"
      width={1024}
      height={422}
      className={className}
      priority={priority}
    />
  );
}
