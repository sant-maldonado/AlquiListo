import { ProfileModel } from '../models/profileModel.js';
import { GuarantorModel } from '../models/guarantorModel.js';

async function uploadContextMiddleware(req, _res, next) {
  const userId = req.user?.id;
  const guarantorToken = req.body?.invite_token || req.query?.invite_token || req.headers?.['x-guarantor-token'];

  if (userId) {
    const profile = await ProfileModel.findByUserId(userId);
    if (profile) {
      req.uploadContext = { profileId: profile.id, guarantorId: null };
      return next();
    }
  }

  if (guarantorToken) {
    const guarantor = await GuarantorModel.findByInviteToken(guarantorToken);
    if (guarantor) {
      req.uploadContext = {
        profileId: null,
        guarantorId: guarantor.id,
      };
      return next();
    }
  }

  return next();
}

export default uploadContextMiddleware;
