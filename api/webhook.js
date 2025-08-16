module.exports = (req, res) => {
  console.log("Method:", req.method);
  console.log("Headers:", req.headers);
  
  if (req.method === "GET") {
    return res.status(200).json({success: true, time: new Date().toISOString()});
  }
  
  if (req.method === "POST") {
    return res.status(200).json({success: true, method: "POST", time: new Date().toISOString()});
  }
  
  res.status(405).json({error: "Method not allowed"});
};
