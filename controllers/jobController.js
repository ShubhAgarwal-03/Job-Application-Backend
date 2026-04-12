const Job = require("../models/job");

// CREATE JOB (ADMIN ONLY)
exports.createJob = async (req, res) => {
  try {
    const { title, company, description, type } = req.body;

    const job = await Job.create({
      title,
      company,
      description,
      type: type || "full-time",    //default is full time
      createdBy: req.user.id,
    });

    res.status(201).json({
      message: "Job created successfully",
      job,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL JOBS (USER + ADMIN)
exports.getJobs = async (req, res) => {
  try {

    const page = parseInt(req.query.page)||1;
    const limit = parseInt(req.query.limit)||5;
    const keyword = req.query.keyword || "";
    const type = req.query.type || "all";

    const skip = (page - 1)*limit;      //for next page
    // these act as the applications shown in a single page

    let query = {};

    if (keyword){
      query = {
        $or: [
          { title: { $regex: keyword, $options: "i"} },     // regex is like "contains", i represents case-insensitive
          { company: { $regex: keyword, $options: "i"}},
        ],
      };
    }

    if(type && type !== "all"){
      query.type = type;
    }

    const jobs = await Job.find(query)      // accounts for both query + normal viewing
      .sort( {createdAt: -1})     // keeps sorting and shows the newest jobs at the top.
      .populate("createdBy", "name email")
      .skip(skip)
      .limit(limit);

    const totalJobs = await Job.countDocuments(query);    // count only the specified jobs

    const formatted = jobs.map((job) => ({
      id: job._id,
      title: job.title,
      company: job.company,
      description: job.description,
      type: job.type,
      createdBy:{
        id: job.createdBy?._id,             // ? is optional chaining, i.e., it doesnt break if the val is null
        name: job.createdBy?.name,
        email: job.createdBy?.email,
      }, 
      createdAt: job.createdAt,
    }));

    //res.json(jobs);
    res.json({
      page, 
      totalPages: Math.ceil(totalJobs/limit),
      totalJobs,
      jobs: formatted,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE JOB (ADMIN ONLY)
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    
    if(job.createdBy.toString() !== req.user.id){
      return res.status(403).json({ message: "You can only delete your own jobs"});
    }

    await job.deleteOne();

    res.json({ message: "Job deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSingleJob = async(req, res) => {
  try{
    const job = await Job.findById(req.params.id).populate(
      "createdBy",
      "name email"
    );

    if(!job){
      return res.status(404).json({ message: "Job not found" });
    }

    res.json({
      id: job._id,
      title: job.title,
      company: job.company,
      description: job.description,
      type: job.type,
      createdBy:{
        id: job.createdBy._id,
        name: job.createdBy.name,
        email: job.createdBy.email,
      }, 
      createdAt: job.createdAt,
    });
    // this is necessary to display the messages in a better-organized manner and would be helpful in teh frontend
  }
  catch(error){
    res.status(500).json({ messages: error.message});
  }
}