export interface Review {
  id: string;
  organizationId: string;
  membershipId: string;
  residentName: string;
  rating: number;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewInput {
  rating: number;
  body: string;
}

export interface UpdateReviewInput {
  rating: number;
  body: string;
}
