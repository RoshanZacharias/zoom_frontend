import styled from 'styled-components';

// Define types for props
interface MessageProps {
  isPatient: boolean;
}

interface BubbleProps extends MessageProps {
  isArabic: boolean;
}

export const ChatContainer = styled.div`
  width: 100%;
  height: 580px; 
  background-color: rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1rem;
  font-family: 'Segoe UI', sans-serif;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.05); 
  box-sizing: border-box;
  backdrop-filter: blur(10px);
`;


export const TranslateWrapper = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #fff;
`;

export const TranslateLabel = styled.label`
  color: #fff;
  font-size: 0.9rem;
  margin-right: 0.5rem;
`;

export const TranslateSelect = styled.select`
  padding: 0.3rem 1rem;
  border-radius: 8px;
  border: none;
  background: #fff;
  color: #000;
  font-size: 0.9rem;
  cursor: pointer;
  outline: none;
`;

export const InfoIcon = styled.img`
  width: 20px;
  height: 20px;
  margin-left: 38.3rem;
  cursor: pointer;
  color: #fff;
`;


export const MessagesWrapper = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 1rem;
  max-width: 100%;
  box-sizing: border-box;
`;

export const MessageBlock = styled.div<MessageProps>`
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  align-items: ${({ isPatient }) => (isPatient ? 'flex-end' : 'flex-start')};
`;

export const NameLabel = styled.span<MessageProps>`
  font-weight: bold;
  color: ${({ isPatient }) => (isPatient ? '#fff' : '#fff')};
  margin-bottom: 0.3rem;
  display: flex;
  align-items: center;
`;

export const ChatBubble = styled.div<BubbleProps>`
  background: ${({ isPatient }) => (isPatient ? '#37b6e7' : '#f2f3f5')};
  color: ${({ isPatient }) => (isPatient ? '#fff' : '#000')};
  padding: 1rem;
  border-radius: 20px;
  max-width: 70%;
  position: relative;
  font-size: 1rem;
  line-height: 1.5;
  text-align: ${({ isArabic }) => (isArabic ? 'right' : 'left')};
  
  /* Prevent text overflow */
  word-wrap: break-word;
  overflow-wrap: break-word;
  white-space: pre-wrap;
`;

export const TimeStamp = styled.span<MessageProps>`
  font-size: 0.75rem;
  color: #fff;
  margin-top: 0.3rem;
  align-self: ${({ isPatient }) => (isPatient ? 'flex-end' : 'flex-start')};
`;


export const InputWrapper = styled.div`
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  border-top: 1px solid #ddd;
  background-color: #fff;
  border-radius: 25px;
  margin-top: 1rem;
  gap: 0.5rem;
`;


export const IconWrapper = styled.div`
  display: flex;
  gap: 0.5rem;

  
`;


export const IconButton = styled.button`
  background-color:rgb(221, 222, 223);
  border: none;
  border-radius: 50%;
  padding: 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 16px;
    height: 16px;
  }

  &:hover {
    background:rgb(177, 177, 177);
  }
`;



export const TextInput = styled.input`
  flex: 1;
  padding: 0.4rem 0.75rem;
  border: none;
  border-radius: 20px;
  font-size: 1rem;
  outline: none;
`;

export const SendButton = styled.button`
  background: #f082ac;
  color: #fff;
  border: none;
  padding: 5px 10px;
  margin-left: 0.5rem;
  border-radius: 50px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.3s;


  img {
    width: 18px;
    height: 18px;
  }

  &:hover {
    background: #de6b97;
  }
`;


export const MessageWithIcon = styled.div`
  display: flex;
  align-items: center;
  gap: 8px; 
`;


export const BubbleWithIcon = styled.div<{ isPatient: boolean }>`
  display: flex;
  align-items: center;
  justify-content: ${({ isPatient }) => (isPatient ? 'flex-end' : 'flex-start')};
  gap: 8px; 
`;


export const SpeakerIcon = styled.img`
  width: 20px;
  height: 20px;
  cursor: pointer;
  user-select: none;
`;