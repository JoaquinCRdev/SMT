export async function addMember(req, res, next) {
  try {
    const member = await workshopService.addMember(req.user, req.body);
    res.status(201).json(member);
  } catch (error) {
    next(error);
  }
}

export async function updateMember(req, res, next) {
  try {
    const member = await workshopService.updateMember(
      req.user,
      req.params.userId,
      req.body,
    );
    res.status(200).json(member);
  } catch (error) {
    next(error);
  }
}