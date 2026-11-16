export const COMMON_SECURITY_QUESTIONS = [
  { key: 'COMMON_01', text: 'What was the first dish you learned to cook by yourself?' },
  { key: 'COMMON_02', text: 'What childhood nickname did your family commonly call you?' },
  { key: 'COMMON_03', text: 'What was the name of a teacher you remember most from elementary school?' },
  { key: 'COMMON_04', text: 'What was the first place you traveled to without your parents?' },
  { key: 'COMMON_05', text: 'What food did you dislike most when you were a child?' },
  { key: 'COMMON_06', text: 'What was the name of your favorite childhood toy or personal item?' },
  { key: 'COMMON_07', text: 'What was the first movie or television show you remember loving?' },
  { key: 'COMMON_08', text: 'What was the name of the first close friend you remember having?' },
  { key: 'COMMON_09', text: 'What was the first sport, game, or hobby you seriously learned?' },
  { key: 'COMMON_10', text: 'What was the first thing you bought using money you earned yourself?' },
  { key: 'COMMON_11', text: 'What place from your childhood do you remember visiting most often?' },
  { key: 'COMMON_12', text: 'What was your favorite homemade food while growing up?' },
  { key: 'COMMON_13', text: 'What personal goal did you dream of achieving when you were younger?' },
  { key: 'COMMON_14', text: 'What memorable name or nickname did you give one of your personal belongings?' },
  { key: 'COMMON_15', text: 'What memorable word or phrase is connected to an important childhood memory?' },
] as const;

export const ADMIN_SECURITY_QUESTIONS = [
  { key: 'ADMIN_01', text: 'What was the first organization, workplace, or group where you were given responsibility for other people?' },
  { key: 'ADMIN_02', text: 'What was the first major item you purchased entirely using your own earnings?' },
  { key: 'ADMIN_03', text: 'What private memorable name or phrase do you associate with your first major leadership responsibility?' },
] as const;

export const ALL_SECURITY_QUESTIONS = [
  ...COMMON_SECURITY_QUESTIONS,
  ...ADMIN_SECURITY_QUESTIONS,
] as const;

export const COMMON_SECURITY_KEYS: ReadonlySet<string> = new Set(
  COMMON_SECURITY_QUESTIONS.map((q) => q.key),
);

export const ADMIN_SECURITY_KEYS: ReadonlySet<string> = new Set(
  ADMIN_SECURITY_QUESTIONS.map((q) => q.key),
);
