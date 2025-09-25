import Community from '../models/Community.js';
import Student from '../models/student-model.js';
import Volunteer from '../models/Volunteers-model.js';

// ✅ Get all communities
export const getAllCommunities = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 10 } = req.query;

    let query = { isActive: true };

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search) {
      query.$text = { $search: search };
    }

    const communities = await Community.find(query)
      .populate('createdBy', 'user')
      .populate('members.user', 'username email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Community.countDocuments(query);

    res.json({
      communities,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get single community
export const getCommunity = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id)
      .populate('createdBy', 'user')
      .populate('members.user', 'username email')
      .populate('channels');

    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    res.json(community);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Create new community (volunteers only)
export const createCommunity = async (req, res) => {
  try {
    const volunteer = await Volunteer.findById(req.user.volunteerId);

    if (!volunteer || !volunteer.canCreateCommunities) {
      return res.status(403).json({ message: 'Not authorized to create communities' });
    }

    const { name, description, category, rules } = req.body;

    const existingCommunity = await Community.findOne({ name });
    if (existingCommunity) {
      return res.status(400).json({ message: 'Community name already exists' });
    }

    const community = new Community({
      name,
      description,
      category,
      rules: rules || [],
      createdBy: req.user.volunteerId
    });

    const savedCommunity = await community.save();

    volunteer.createdCommunities.push(savedCommunity._id);
    await volunteer.save();

    res.status(201).json(savedCommunity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Join community
export const joinCommunity = async (req, res) => {
  try {
    const communityId = req.params.id; // get from URL
    const { username } = req.body;
    const userId = req.user.id;

    console.log("User ID:", userId);
    console.log("Community ID:", communityId);
    console.log("Username:", username);

    const community = await Community.findById(communityId);
    console.log("Fetched community:", community);

    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    const isMember = community.members.some(
      member => member.user.toString() === userId
    );

    if (isMember) {
      return res.status(400).json({ message: 'Already a member of this community' });
    }

    const usernameExists = community.members.some(
      member => member.username === username
    );

    if (usernameExists) {
      return res.status(400).json({ message: 'Username already taken in this community' });
    }

    community.members.push({
      user: userId,
      username
    });

    await community.save();

    const user = await Student.findById(userId);
    user.communityProfiles.push({
      community: communityId,
      username
    });

    await user.save();

    console.log("User joined successfully");
    res.json({ message: 'Successfully joined community', community });
  } catch (error) {
    console.error("Error joining community:", error);
    res.status(500).json({ message: error.message });
  }
};


// ✅ Leave community
export const leaveCommunity = async (req, res) => {
  try {
    const { communityId } = req.params;
    const userId = req.user.id;

    console.log("User leaving:", userId);
    console.log("Community ID:", communityId);

    const community = await Community.findById(communityId);
    if (!community) {
      console.log("Community not found");
      return res.status(404).json({ message: 'Community not found' });
    }

    console.log("Current members before leaving:", community.members);

    // Filter out the leaving user
    community.members = community.members.filter(
      member => member.user.toString() !== userId.toString()
    );

    console.log("Members after leaving:", community.members);

    await community.save();

    const user = await Student.findById(userId);
    if (!user) {
      console.log("Student not found");
      return res.status(404).json({ message: 'Student not found' });
    }

    console.log("Community profiles before leaving:", user.communityProfiles);

    // Remove the community from student's communityProfiles
    user.communityProfiles = user.communityProfiles.filter(
      profile => profile.community.toString() !== communityId.toString()
    );

    console.log("Community profiles after leaving:", user.communityProfiles);

    await user.save();

    res.json({ message: 'Successfully left community', community });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};



// ✅ Update community (volunteers/admins only)
export const updateCommunity = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);

    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    const volunteer = await Volunteer.findById(req.user.volunteerId);
    const isCreator = community.createdBy.toString() === req.user.volunteerId;
    const hasModerationRights = volunteer.moderationRights.some(
      right => right.community.toString() === req.params.id
    );

    if (!isCreator && !hasModerationRights) {
      return res.status(403).json({ message: 'Not authorized to update this community' });
    }

    const updatedCommunity = await Community.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json(updatedCommunity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
