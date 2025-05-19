import styled from "styled-components";

export const CardContainer = styled.div`
  display: flex;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 20px;
  padding: 15px;
  width: 92%;
  max-width: 600px;
  color: white;
//   box-shadow: 0 8px 10px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  margin-top: 12px;
`;

export const DoctorImage = styled.img`
  width: 110px;
  height: 110px;
  object-fit: cover;
  border-radius: 50px;
  margin-right: 20px;
`;

export const DoctorDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const DoctorName = styled.h2`
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0;
`;

export const Department = styled.div`
  color: #f5d76e;
  font-weight: 600;
  display: flex;
  align-items: center;
  font-size: 1.1rem;
`;

export const HeartIcon = styled.span`
  margin-right: 6px;
`;

export const Specialization = styled.div`
  font-size: 1rem;
`;

export const Experience = styled.div`
  font-size: 1rem;
`;

export const Fee = styled.div`
  font-size: 1rem;
`;