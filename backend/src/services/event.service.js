import Event from "../models/Event.js";

export const createEvent = async (data) => {
  const event = await Event.create(data);
  return event;
};

export const getEvents = async (userId) => {
  return await Event.find({ creator: userId }).populate("calendar");
};

export const deleteEvent = async (id, userId) => {
  const event = await Event.findOne({ _id: id, creator: userId });
  if (!event) throw new Error("Event not found");
  await event.deleteOne();
  return true;
};
export const getUserEvents = async (userId) => {
  return await Event.find({ creator: userId });
};

export const addEvent = async (userId, data) => {
  return await Event.create({
    ...data,
    creator: userId,
  });
};