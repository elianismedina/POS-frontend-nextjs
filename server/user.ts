export const getUsers = async () => {
  const users = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user`);
  return users.json();
};
