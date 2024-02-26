import jwt from 'jsonwebtoken';

export const SECRET: string = process.env.JWT_SECRET!;

interface Payload {
  id: string;
}

const setjwt = async (userId: string): Promise<string> => {
  const payload: Payload = {
    id: userId,
  };
  return await jwt.sign(payload, SECRET, { expiresIn: '7d' });
};

const getjwt = async (token: string): Promise<Payload | null> => {
  if (!token) return null;

  return await jwt.verify(token, SECRET) as Payload;
};

export {
  setjwt,
  getjwt,
};
