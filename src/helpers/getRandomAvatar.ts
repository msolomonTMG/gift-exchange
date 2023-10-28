export const getRandomAvatar = (): string => {
  const avatars: string[] = [
    "https://openmoji.org/data/color/svg/1F43A.svg",
    "https://openmoji.org/data/color/svg/1F98A.svg",
    "https://openmoji.org/data/color/svg/1F984.svg",
    "https://openmoji.org/data/color/svg/1F43B.svg",
    "https://openmoji.org/data/color/svg/1F43C.svg",
    "https://openmoji.org/data/color/svg/1F438.svg",
  ];

  const defaultAvatar = "https://openmoji.org/data/color/svg/1F43A.svg";
  return avatars[Math.floor(Math.random() * avatars.length)] ?? defaultAvatar;
};

export default getRandomAvatar;