export class UserResponseDto {
  id: number;
  name: string;
  email: string;
  username: string;
  plan: 'FREE' | 'GOLD';
  baseId: number;
  base: {
    id: number;
    name: string;
    city: string;
    state: string;
  };
}

export class UpdateUserBaseDto {
  baseId: number;
}
