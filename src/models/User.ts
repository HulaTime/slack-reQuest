export interface IUser {
  id: string;
  name: string;
}

export class UserModel implements IUser {
  constructor(
    public id: string,
    public name: string,
  ) {}
}
