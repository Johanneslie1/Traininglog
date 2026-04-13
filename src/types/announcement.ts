export interface CoachAnnouncement {
  id: string;
  message: string;
  createdAt: string;
  createdBy: string;
  createdByName?: string;
  targetTeamIds?: string[];
  targetAthleteIds?: string[];
  recipientUserIds: string[];
}

export interface CreateCoachAnnouncementInput {
  message: string;
  targetTeamIds?: string[];
  targetAthleteIds?: string[];
}
