import type { Topic } from '@/types';

export const part1Topics: Omit<Topic, 'id'>[] = [
  {
    part: 1, category: 'daily', title: 'Hometown',
    content: 'Questions about your hometown',
    prompts: [], questions: [
      'Where is your hometown?',
      'What do you like most about your hometown?',
      'Would you say your hometown is a good place to live?',
    ], examples: [
      { simple: 'My hometown is Zhengzhou.', band7: 'I was born and raised in Zhengzhou, the capital of Henan Province in central China. I\'ve been living in Hangzhou for about 10 years now, so it feels like a second home to me.' },
      { simple: 'I like the food and the friendly people.', band7: 'What I appreciate most is the sense of community — people are genuinely warm and welcoming, and the local cuisine is absolutely outstanding, especially the street food.' },
      { simple: 'Yes, it is a good place because it is peaceful.', band7: 'Overall I\'d say yes, though it depends on what you\'re looking for. It\'s ideal for families because of the low crime rate and good schools, but young people might find it lacking in entertainment options.' },
    ], relatedPart2Id: null, difficulty: 'easy', isCustom: false, isFavorite: false, createdAt: 0, updatedAt: 0,
  },
  {
    part: 1, category: 'daily', title: 'Work or Study',
    content: 'Questions about your work or studies',
    prompts: [], questions: [
      'Do you work or are you a student?',
      'What do you like most about your work/studies?',
      'Is there anything you would like to change about your work/studies?',
    ], examples: [
      { simple: 'I am a frontend developer.', band7: 'I\'m a frontend developer — I\'ve been working in this field for about 15 years now. I\'m currently based in Hangzhou, working for one of the top internet companies here.' },
      { simple: 'I like coding and building things.', band7: 'What I love most about being a programmer is the creative aspect — turning a design into a fully functional, interactive experience. There\'s a real sense of satisfaction when you see users actually engaging with something you\'ve built from scratch. Plus, the tech world evolves so quickly that there\'s always something new to learn, which keeps the job exciting.' },
      { simple: 'I wish there were fewer meetings.', band7: 'If I could change one thing, it would probably be the amount of time spent in meetings and on cross-team coordination. In a large company, communication overhead can be quite significant, and it sometimes eats into the focused coding time that I genuinely enjoy. But overall, I really love what I do — being a programmer is incredibly fulfilling.' },
    ], relatedPart2Id: null, difficulty: 'easy', isCustom: false, isFavorite: false, createdAt: 0, updatedAt: 0,
  },
  {
    part: 1, category: 'daily', title: 'Accommodation',
    content: 'Questions about where you live',
    prompts: [], questions: [
      'Do you live in a house or an apartment?',
      'What do you like about your accommodation?',
      'Would you like to change anything about where you live?',
    ], examples: [
      { simple: 'I live in an apartment near the city center.', band7: 'I rent a two-bedroom apartment in a fairly modern complex on the outskirts of the city, about a 20-minute commute from downtown.' },
      { simple: 'I like that it is close to my office.', band7: 'The best thing about it is the location — it\'s within walking distance of my workplace, and there are plenty of shops and restaurants nearby, which makes daily life very convenient.' },
      { simple: 'I wish it had a bigger kitchen.', band7: 'The kitchen is quite cramped, which is frustrating because I enjoy cooking. If I could, I\'d also add a balcony to get some outdoor space and natural light.' },
    ], relatedPart2Id: null, difficulty: 'easy', isCustom: false, isFavorite: false, createdAt: 0, updatedAt: 0,
  },
  {
    part: 1, category: 'daily', title: 'Music',
    content: 'Questions about music preferences',
    prompts: [], questions: [
      'What kind of music do you like?',
      'Do you play any musical instruments?',
      'Has your taste in music changed over the years?',
    ], examples: [
      { simple: 'I like pop music and rock.', band7: 'I\'m quite eclectic in my taste, but I\'d say I gravitate towards indie rock and jazz — I find they have more depth and variety compared to mainstream pop.' },
      { simple: 'No, I don\'t play any instruments.', band7: 'I picked up the guitar a few years ago as a hobby. I\'m still at an intermediate level, but I find it really relaxing to play after a long day at work.' },
      { simple: 'Yes, I used to like rock but now I like jazz.', band7: 'Definitely. When I was younger, I was really into loud, energetic music like rock and hip-hop. But as I\'ve gotten older, I\'ve developed a taste for more mellow genres like jazz and classical.' },
    ], relatedPart2Id: null, difficulty: 'easy', isCustom: false, isFavorite: false, createdAt: 0, updatedAt: 0,
  },
  {
    part: 1, category: 'daily', title: 'Reading',
    content: 'Questions about reading habits',
    prompts: [], questions: [
      'Do you enjoy reading?',
      'What kind of books do you like to read?',
      'Do you prefer reading e-books or printed books?',
    ], examples: [
      { simple: 'Yes, I read every day before bed.', band7: 'Absolutely — I\'m an avid reader. I try to read for at least half an hour before going to sleep; it helps me unwind after a busy day.' },
      { simple: 'I like novels and self-help books.', band7: 'I tend to gravitate towards historical fiction and biographies. I find that books about real people and events are not only entertaining but also educational.' },
      { simple: 'I prefer printed books because they feel nice.', band7: 'I still prefer printed books for the tactile experience — there\'s something about turning physical pages that e-readers just can\'t replicate. That said, I do use e-books when traveling for convenience.' },
    ], relatedPart2Id: null, difficulty: 'easy', isCustom: false, isFavorite: false, createdAt: 0, updatedAt: 0,
  },
  {
    part: 1, category: 'daily', title: 'Sports',
    content: 'Questions about sports and exercise',
    prompts: [], questions: [
      'Do you like playing sports?',
      'What sports are popular in your country?',
      'How often do you exercise?',
    ], examples: [
      { simple: 'Yes, I play basketball with my friends.', band7: 'I\'m quite sporty actually — I play basketball with a local team every weekend, and I try to go swimming a couple of times during the week.' },
      { simple: 'Table tennis and badminton are very popular.', band7: 'In my country, table tennis and badminton are extremely popular, partly because they don\'t require much space or expensive equipment. Football has also been growing rapidly in recent years.' },
      { simple: 'I exercise about three times a week.', band7: 'I aim for at least four sessions a week — usually a mix of jogging, yoga, and strength training. I find that regular exercise really helps me stay focused and energized.' },
    ], relatedPart2Id: null, difficulty: 'easy', isCustom: false, isFavorite: false, createdAt: 0, updatedAt: 0,
  },
  {
    part: 1, category: 'daily', title: 'Cooking',
    content: 'Questions about cooking and food',
    prompts: [], questions: [
      'Do you enjoy cooking?',
      'What is your favorite dish to cook?',
      'Do you prefer eating at home or dining out?',
    ], examples: [
      { simple: 'Yes, I cook dinner every day.', band7: 'I genuinely enjoy cooking — it\'s a creative outlet for me. I find it really satisfying to take raw ingredients and transform them into something delicious.' },
      { simple: 'My favorite dish to cook is pasta.', band7: 'I\'d have to say stir-fried noodles with vegetables — it\'s quick, healthy, and I can adjust the flavors to my liking. I\'ve been perfecting my recipe over the past year.' },
      { simple: 'I prefer eating at home because it is cheaper.', band7: 'It depends on the situation. On weekdays, I prefer home-cooked meals because they\'re healthier and more economical. But on weekends, I enjoy trying new restaurants as a social activity.' },
    ], relatedPart2Id: null, difficulty: 'easy', isCustom: false, isFavorite: false, createdAt: 0, updatedAt: 0,
  },
  {
    part: 1, category: 'technology', title: 'Social Media',
    content: 'Questions about social media usage',
    prompts: [], questions: [
      'Do you use social media?',
      'How much time do you spend on social media each day?',
      'Do you think social media has more positive or negative effects?',
    ], examples: [
      { simple: 'Yes, I use WeChat and Instagram every day.', band7: 'I\'m active on a few platforms — mainly WeChat for messaging and Instagram for sharing photos. I try to be mindful about my usage, though.' },
      { simple: 'I spend about two hours a day on social media.', band7: 'I\'d estimate around one to two hours, mostly during my commute or before bed. I\'ve actually set screen-time limits on my phone because it\'s easy to lose track of time.' },
      { simple: 'I think it has both good and bad effects.', band7: 'That\'s a double-edged sword, in my view. On one hand, it\'s revolutionized how we stay connected and share information. On the other, it can fuel anxiety and create a distorted sense of reality, especially among young people.' },
    ], relatedPart2Id: null, difficulty: 'medium', isCustom: false, isFavorite: false, createdAt: 0, updatedAt: 0,
  },
  {
    part: 1, category: 'technology', title: 'The Internet',
    content: 'Questions about internet usage',
    prompts: [], questions: [
      'How often do you use the internet?',
      'What do you usually use the internet for?',
      'Do you think the internet has changed the way people communicate?',
    ], examples: [
      { simple: 'I use the internet every day for work and study.', band7: 'I\'m online pretty much all day — I rely on it for work, research, staying in touch with friends, and even managing my finances.' },
      { simple: 'I use it for watching videos and reading news.', band7: 'My main uses are professional — emails, online collaboration tools, and research. But I also use it for entertainment, like streaming documentaries and keeping up with current affairs.' },
      { simple: 'Yes, people talk less face to face now.', band7: 'Absolutely. The internet has shifted communication from face-to-face to digital. While this has made it easier to stay in touch across distances, I think it\'s also reduced the depth of our interactions — people tend to have more connections but fewer meaningful relationships.' },
    ], relatedPart2Id: null, difficulty: 'medium', isCustom: false, isFavorite: false, createdAt: 0, updatedAt: 0,
  },
  {
    part: 1, category: 'daily', title: 'Weather',
    content: 'Questions about weather preferences',
    prompts: [], questions: [
      'What kind of weather do you like most?',
      'Does the weather affect your mood?',
      'What is the weather like in your hometown?',
    ], examples: [
      { simple: 'I like sunny and warm weather.', band7: 'I\'m most content on crisp, sunny autumn days — not too hot, not too cold. There\'s something about the clear skies and cool air that makes me feel energized.' },
      { simple: 'Yes, I feel sad when it rains.', band7: 'Definitely. On gloomy, overcast days, I tend to feel more lethargic and less motivated. Sunny weather, on the other hand, puts me in a much more positive frame of mind.' },
      { simple: 'It is hot in summer and cold in winter.', band7: 'My hometown Zhengzhou has a typical continental climate — very hot and humid summers with temperatures often exceeding 35 degrees, and cold, dry winters. Since I\'ve been living in Hangzhou for 10 years, I\'m also used to the more humid southern weather.' },
    ], relatedPart2Id: null, difficulty: 'easy', isCustom: false, isFavorite: false, createdAt: 0, updatedAt: 0,
  },
  {
    part: 1, category: 'daily', title: 'Shopping',
    content: 'Questions about shopping habits',
    prompts: [], questions: [
      'Do you enjoy shopping?',
      'Do you prefer shopping online or in stores?',
      'What do you usually buy when you go shopping?',
    ], examples: [
      { simple: 'Yes, I like shopping for clothes.', band7: 'To be honest, I\'m not a big fan of shopping — I find it quite tiring. But I do enjoy browsing bookstores and tech shops when I have free time.' },
      { simple: 'I prefer online shopping because it is convenient.', band7: 'I do most of my shopping online nowadays — it\'s more convenient and often cheaper. But for things like clothes, I still prefer physical stores so I can try things on.' },
      { simple: 'I usually buy food and daily necessities.', band7: 'Most of my shopping is practical — groceries, household essentials, and occasionally books or gadgets. I try to avoid impulse purchases.' },
    ], relatedPart2Id: null, difficulty: 'easy', isCustom: false, isFavorite: false, createdAt: 0, updatedAt: 0,
  },
  {
    part: 1, category: 'daily', title: 'Transportation',
    content: 'Questions about how you travel',
    prompts: [], questions: [
      'How do you usually get to work or school?',
      'What is the public transport like in your city?',
      'Would you like to change anything about the transport system?',
    ], examples: [
      { simple: 'I take the subway every day.', band7: 'I commute by subway — it takes about 40 minutes door to door. I usually read or listen to podcasts during the ride, so it\'s fairly productive time.' },
      { simple: 'The public transport is okay but sometimes crowded.', band7: 'The public transport network is quite extensive and affordable, but during rush hour it can be overwhelmingly crowded, which makes the experience rather unpleasant.' },
      { simple: 'I wish the buses were more frequent.', band7: 'If I could change one thing, it would be increasing the frequency of buses, especially in suburban areas where the wait time can be 20 minutes or more. Better real-time information at stops would also help.' },
    ], relatedPart2Id: null, difficulty: 'easy', isCustom: false, isFavorite: false, createdAt: 0, updatedAt: 0,
  },
  {
    part: 1, category: 'education', title: 'Languages',
    content: 'Questions about learning languages',
    prompts: [], questions: [
      'How many languages can you speak?',
      'What is the most difficult part of learning a new language?',
      'Why do you think English is an important language to learn?',
    ], examples: [
      { simple: 'I can speak Chinese and a little English.', band7: 'I\'m a native Mandarin speaker, and I\'ve been studying English for over ten years. I also picked up some basic Japanese from watching anime.' },
      { simple: 'Pronunciation and grammar are the hardest.', band7: 'I\'d say the most challenging aspect is achieving natural-sounding pronunciation, followed closely by mastering idiomatic expressions that don\'t translate literally from your mother tongue.' },
      { simple: 'English is used in many countries for business.', band7: 'English has become the global lingua franca — it\'s the primary language of international business, science, and technology. Being proficient in English opens doors to opportunities worldwide and gives you access to a vast amount of information.' },
    ], relatedPart2Id: null, difficulty: 'medium', isCustom: false, isFavorite: false, createdAt: 0, updatedAt: 0,
  },
  {
    part: 1, category: 'daily', title: 'Holidays',
    content: 'Questions about holidays and travel',
    prompts: [], questions: [
      'What do you usually do during holidays?',
      'Where would you like to go for your next holiday?',
      'Do you prefer relaxing holidays or active ones?',
    ], examples: [
      { simple: 'I usually visit my family during holidays.', band7: 'During longer holidays, I typically visit my family in Zhengzhou, my hometown. For shorter breaks, I enjoy taking short trips to nearby cities or simply relaxing at home with a good book.' },
      { simple: 'I want to go to Japan next time.', band7: 'I\'ve always dreamed of visiting Japan — the combination of ancient temples, modern cities, and incredible food really appeals to me. I\'m hoping to go there next spring for cherry blossom season.' },
      { simple: 'I like relaxing holidays more.', band7: 'I tend to prefer a balance — a few days of sightseeing and activities, followed by a couple of days of pure relaxation. I find that a holiday that\'s too packed can leave you feeling more tired than before.' },
    ], relatedPart2Id: null, difficulty: 'easy', isCustom: false, isFavorite: false, createdAt: 0, updatedAt: 0,
  },
  {
    part: 1, category: 'daily', title: 'Daily Routine',
    content: 'Questions about your daily routine',
    prompts: [], questions: [
      'What is your typical daily routine?',
      'Which part of the day do you like most?',
      'Would you like to change anything about your routine?',
    ], examples: [
      { simple: 'I wake up at 7, go to work, and come home at 6.', band7: 'My day usually starts around 7 with a quick workout and breakfast. I\'m at my desk by 9, work through until around 6, then spend the evening cooking dinner and unwinding with a book or some TV.' },
      { simple: 'I like the evening the most because I can relax.', band7: 'I\'d say the early morning is my favorite time — everything is quiet, and I have a moment to myself before the day gets busy. It\'s when I feel most creative and clear-headed.' },
      { simple: 'I wish I could wake up later.', band7: 'I\'d love to have more flexibility in my mornings. Waking up early every day can be exhausting, and I think having the option to start later occasionally would make me more productive overall.' },
    ], relatedPart2Id: null, difficulty: 'easy', isCustom: false, isFavorite: false, createdAt: 0, updatedAt: 0,
  },
  {
    part: 1, category: 'daily', title: 'Television',
    content: 'Questions about TV watching habits',
    prompts: [], questions: [
      'How much television do you watch?',
      'What kind of programs do you enjoy watching?',
      'Do you think watching TV is a good way to relax?',
    ], examples: [
      { simple: 'I watch TV for about one hour a day.', band7: 'I don\'t watch traditional TV much anymore — maybe an hour or so in the evening. I mostly stream shows on demand, which gives me more control over what and when I watch.' },
      { simple: 'I like documentaries and comedies.', band7: 'I\'m drawn to documentaries, especially ones about nature and history, and I also enjoy well-written comedy series. I find that a good comedy is the perfect way to decompress after a stressful day.' },
      { simple: 'Yes, it helps me relax after work.', band7: 'It can be, but it depends on what you watch. Mindless channel-surfing isn\'t particularly restorative, but deliberately choosing a program you enjoy can be a great way to unwind and take your mind off things.' },
    ], relatedPart2Id: null, difficulty: 'easy', isCustom: false, isFavorite: false, createdAt: 0, updatedAt: 0,
  },
  {
    part: 1, category: 'daily', title: 'Friends',
    content: 'Questions about friendships',
    prompts: [], questions: [
      'Do you prefer spending time with one friend or a group of friends?',
      'What do you usually do with your friends?',
      'Do you think it is important to have many friends?',
    ], examples: [
      { simple: 'I prefer spending time with one or two close friends.', band7: 'I\'d say I prefer smaller gatherings — one or two close friends. I find that the conversations are deeper and more meaningful, whereas in large groups the interaction tends to be more superficial.' },
      { simple: 'We usually go out for dinner or watch movies.', band7: 'We often grab dinner together or go to the cinema. On weekends, we sometimes take day trips to nearby towns or just hang out at someone\'s apartment and cook together.' },
      { simple: 'Quality is more important than quantity for friends.', band7: 'I believe it\'s far more important to have a few genuine, trustworthy friends than a large circle of acquaintances. Real friendships require time and effort to maintain, so it\'s quality over quantity for me.' },
    ], relatedPart2Id: null, difficulty: 'easy', isCustom: false, isFavorite: false, createdAt: 0, updatedAt: 0,
  },
  {
    part: 1, category: 'society', title: 'Pets',
    content: 'Questions about keeping pets',
    prompts: [], questions: [
      'Do you have any pets?',
      'What kind of pets are popular in your country?',
      'Do you think it is good for children to grow up with pets?',
    ], examples: [
      { simple: 'Yes, I have a cat.', band7: 'I have a tabby cat named Mimi who\'s been with me for about three years now. She\'s quite independent but also very affectionate when she wants to be.' },
      { simple: 'Dogs and cats are the most popular.', band7: 'Dogs are by far the most popular pet, especially in urban areas where small breeds are practical for apartment living. Cats are also common, and there\'s been a growing trend of keeping exotic pets like reptiles.' },
      { simple: 'Yes, pets can teach children responsibility.', band7: 'Absolutely. Growing up with a pet teaches children empathy, responsibility, and the importance of routine — feeding and caring for an animal is a wonderful way to develop a sense of commitment and compassion.' },
    ], relatedPart2Id: null, difficulty: 'easy', isCustom: false, isFavorite: false, createdAt: 0, updatedAt: 0,
  },
  {
    part: 1, category: 'daily', title: 'Clothes',
    content: 'Questions about clothing preferences',
    prompts: [], questions: [
      'What kind of clothes do you usually wear?',
      'Do you prefer comfortable or fashionable clothes?',
      'Has your style of clothing changed over the years?',
    ], examples: [
      { simple: 'I usually wear casual clothes like jeans and T-shirts.', band7: 'My everyday wardrobe is fairly casual — jeans, T-shirts, and sneakers. But I do dress up a bit more for work, opting for smart-casual outfits.' },
      { simple: 'I prefer comfortable clothes because I move around a lot.', band7: 'I lean towards comfort, but I try to find a balance. I think you can look presentable without sacrificing comfort — well-fitted basics in neutral colors work well for most occasions.' },
      { simple: 'Yes, I used to wear bright colors but now I prefer simple styles.', band7: 'Definitely. In my teens, I was all about bold prints and bright colors. These days, I gravitate towards a more minimalist aesthetic — clean lines, neutral tones, and quality fabrics that last longer.' },
    ], relatedPart2Id: null, difficulty: 'easy', isCustom: false, isFavorite: false, createdAt: 0, updatedAt: 0,
  },
  {
    part: 1, category: 'culture', title: 'Art',
    content: 'Questions about art and creativity',
    prompts: [], questions: [
      'Do you enjoy art?',
      'Have you ever been to an art gallery?',
      'Do you think art is important in society?',
    ], examples: [
      { simple: 'Yes, I like looking at paintings.', band7: 'I wouldn\'t call myself an art expert, but I do appreciate visual arts, particularly contemporary photography and watercolor paintings. I find them quite inspiring.' },
      { simple: 'Yes, I went to a gallery last month.', band7: 'Yes, I try to visit galleries whenever I travel. The most memorable one was a modern art museum I visited in Shanghai — the installations were thought-provoking and really pushed the boundaries of what I considered art.' },
      { simple: 'Yes, art helps people express their feelings.', band7: 'I think art plays a crucial role in society. It challenges us to see the world from different perspectives, sparks important conversations, and provides a creative outlet that\'s essential for emotional well-being.' },
    ], relatedPart2Id: null, difficulty: 'medium', isCustom: false, isFavorite: false, createdAt: 0, updatedAt: 0,
  },
];