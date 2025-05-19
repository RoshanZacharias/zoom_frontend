import React, { useState } from 'react';
import {
  ChatContainer,
  TranslateWrapper,
  TranslateLabel,
  TranslateSelect,
  InfoIcon,
  MessagesWrapper,
  MessageBlock,
  NameLabel,
  ChatBubble,
  TimeStamp,
  InputWrapper,
  IconWrapper,
  IconButton,
  TextInput,
  SendButton,
  BubbleWithIcon,
  SpeakerIcon,
} from '../Styles/ChatboxStyle';
import info_icon1 from '../assets/info_icon1.png';
import send_message from '../assets/send_message.png';
import attach_file from '../assets/attach_file.png';
import key from '../assets/key.png';
import speaker from '../assets/speaker.png';


// Define the structure of a message
interface Message {
  isPatient: boolean;
  name: string;
  text: string;
  time: string;
}

// Define the structure of the messages object with allowed languages
interface Messages {
  English: Message[];
  Arabic: Message[];
  Spanish: Message[];
  French: Message[];
  German: Message[];
}

// Define the allowed language keys
type Language = keyof Messages;

const Chatbox: React.FC = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('English');

  // Simulated messages in different languages (in a real app, you'd use a translation API)
  const messages = {
    English: [
      {
        isPatient: true,
        name: 'Patient (Me)',
        text: 'Hello Doctor. I hope you are well.',
        time: '02:29 PM',
      },
      {
        isPatient: false,
        name: 'Dr. Vance (Doctor)',
        text: "Hello! I'm doing well, thank you for asking. How can I help you today?",
        time: '02:29 PM',
      },
      {
        isPatient: true,
        name: 'Patient (Me)',
        text: "I've been having severe stomach pain, especially after eating.",
        time: '02:29 PM',
      },
      {
        isPatient: false,
        name: 'Dr. Vance (Doctor)',
        text: "I understand. Can you pinpoint the exact location of the pain? And does anything make it better or worse?",
        time: '02:30 PM',
      },
    ],
    Arabic: [
      {
        isPatient: true,
        name: 'Patient (أنا)',
        text: 'السلام عليكم دكتورة. آمل أن تكوني بخير.',
        time: '02:29 PM',
      },
      {
        isPatient: false,
        name: 'Dr. Vance (الطبيبة)',
        text: 'مرحباً! أنا بخير، شكراً لسؤالك. كيف يمكنني مساعدتك اليوم؟',
        time: '02:29 PM',
      },
      {
        isPatient: true,
        name: 'Patient (أنا)',
        text: 'أعاني من ألم شديد في المعدة، خاصة بعد الأكل.',
        time: '02:29 PM',
      },
      {
        isPatient: false,
        name: 'Dr. Vance (الطبيبة)',
        text: 'أفهم ذلك. هل يمكنك تحديد مكان الألم بالضبط؟ وهل هناك أي شيء يجعله أفضل أو أسوأ؟',
        time: '02:30 PM',
      },
    ],
    Spanish: [
      {
        isPatient: true,
        name: 'Paciente (Yo)',
        text: 'Hola Doctora. Espero que estés bien.',
        time: '02:29 PM',
      },
      {
        isPatient: false,
        name: 'Dr. Vance (Doctora)',
        text: '¡Hola! Estoy bien, gracias por preguntar. ¿Cómo puedo ayudarte hoy?',
        time: '02:29 PM',
      },
      {
        isPatient: true,
        name: 'Paciente (Yo)',
        text: 'He estado teniendo un dolor fuerte en el estómago, especialmente después de comer.',
        time: '02:29 PM',
      },
      {
        isPatient: false,
        name: 'Dr. Vance (Doctora)',
        text: 'Entiendo. ¿Puedes señalar la ubicación exacta del dolor? ¿Y hay algo que lo mejore o lo empeore?',
        time: '02:30 PM',
      },
    ],
    French: [
      {
        isPatient: true,
        name: 'Patient (Moi)',
        text: 'Bonjour Docteur. J’espère que vous allez bien.',
        time: '02:29 PM',
      },
      {
        isPatient: false,
        name: 'Dr. Vance (Docteur)',
        text: 'Bonjour ! Je vais bien, merci de demander. Comment puis-je vous aider aujourd’hui ?',
        time: '02:29 PM',
      },
      {
        isPatient: true,
        name: 'Patient (Moi)',
        text: "J'ai de fortes douleurs à l'estomac, surtout après avoir mangé.",
        time: '02:29 PM',
      },
      {
        isPatient: false,
        name: 'Dr. Vance (Docteur)',
        text: 'Je comprends. Pouvez-vous indiquer l’emplacement exact de la douleur ? Et y a-t-il quelque chose qui l’améliore ou l’aggrave ?',
        time: '02:30 PM',
      },
    ],
    German: [
      {
        isPatient: true,
        name: 'Patient (Ich)',
        text: 'Hallo Doktor. Ich hoffe, es geht Ihnen gut.',
        time: '02:29 PM',
      },
      {
        isPatient: false,
        name: 'Dr. Vance (Doktor)',
        text: 'Hallo! Mir geht es gut, danke der Nachfrage. Wie kann ich Ihnen heute helfen?',
        time: '02:29 PM',
      },
      {
        isPatient: true,
        name: 'Patient (Ich)',
        text: 'Ich habe starke Magenschmerzen, besonders nach dem Essen.',
        time: '02:29 PM',
      },
      {
        isPatient: false,
        name: 'Dr. Vance (Doktor)',
        text: 'Ich verstehe. Können Sie die genaue Stelle des Schmerzes angeben? Und gibt es etwas, das ihn lindert oder verschlimmert?',
        time: '02:30 PM',
      },
    ],
  };

  // Define placeholder texts for each language
  const placeholders: Record<Language, string> = {
    English: 'Type your message here...',
    Arabic: 'اكتب رسالتك هنا...',
    Spanish: 'Escribe tu mensaje aquí...',
    French: 'Tapez votre message ici...',
    German: 'Geben Sie Ihre Nachricht hier ein...',
  };


  // Get messages based on selected language
  const currentMessages: Message[] = messages[selectedLanguage as Language] || messages['English'];

  // Get placeholder based on selected language
  const currentPlaceholder = placeholders[selectedLanguage as Language] || placeholders['English'];

  return (
    <ChatContainer>
      <TranslateWrapper>
        <TranslateLabel>Translate View To:</TranslateLabel>
        <TranslateSelect
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
        >
          <option value="English">English</option>
          <option value="Arabic">العربية (Arabic)</option>
          <option value="Spanish">Español (Spanish)</option>
          <option value="French">Français (French)</option>
          <option value="German">Deutsch (German)</option>
        </TranslateSelect>
        <InfoIcon src={info_icon1} alt="info" />
      </TranslateWrapper>
      <MessagesWrapper>
        {currentMessages.map((msg: Message, index: number) => (
          <MessageBlock key={index} isPatient={msg.isPatient}>
          <NameLabel isPatient={msg.isPatient}>{msg.name}</NameLabel>
          <BubbleWithIcon isPatient={msg.isPatient}>
            <ChatBubble isPatient={msg.isPatient} isArabic={selectedLanguage === 'Arabic'}>
              {msg.text}
            </ChatBubble>
            <SpeakerIcon src={speaker} alt="Speaker" />
          </BubbleWithIcon>
          <TimeStamp isPatient={msg.isPatient}>{msg.time}</TimeStamp>
        </MessageBlock>
        
        ))}
      </MessagesWrapper>
      <InputWrapper>
        <IconWrapper>
          <IconButton>
            <img src={attach_file} alt="Attach" />
          </IconButton>
          <IconButton>
            <img src={key} alt="Key" />
          </IconButton>
        </IconWrapper>

        <TextInput placeholder={currentPlaceholder} />
        
        <SendButton>
          <img src={send_message} alt="Send" />
        </SendButton>
      </InputWrapper>
    </ChatContainer>
  );
};

export default Chatbox;
