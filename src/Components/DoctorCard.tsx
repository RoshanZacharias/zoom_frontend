import React from "react";
import {
  CardContainer,
  DoctorImage,
  DoctorDetails,
  DoctorName,
  Department,
  Specialization,
  Experience,
  Fee,
  HeartIcon
} from "../Styles/DoctorCardStyle";

interface DoctorCardProps {
  name: string;
  department: string;
  specialization: string;
  experience: number;
  fee: number;
  imageUrl: string;
}

const DoctorCard: React.FC<DoctorCardProps> = ({
  name,
  department,
  specialization,
  experience,
  fee,
  imageUrl
}) => {
  return (
    <CardContainer>
      <DoctorImage src={imageUrl} alt={name} />
      <DoctorDetails>
        <DoctorName>{name}</DoctorName>
        <Department>
          <HeartIcon>💛</HeartIcon> {department}
        </Department>
        <Specialization>{specialization}</Specialization>
        <Experience>{experience} years experience</Experience>
        <Fee>₹{fee} Consultation</Fee>
      </DoctorDetails>
    </CardContainer>
  );
};

export default DoctorCard;
