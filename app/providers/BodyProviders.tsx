'use client';


interface Props {
  children: React.ReactNode;
}

const BodyProviders = ({ children }: Props) => {
  return (
    <>
      {children}
    </>
  );
};

export default BodyProviders;
