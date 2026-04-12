const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    
     console.log("Allowed roles:", roles);    // added for debugging
    console.log("User role:", req.user.role); // added for debugging

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied: insufficient permissions",
      });
    }

    next();
  };
};

module.exports = authorizeRoles;
