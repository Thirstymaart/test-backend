const express = require('express');
const router = express.Router();
const ButtonClick = require('../models/ButtonClick');
const Vendor = require('../models/Vendor');
const { verifyVendorToken } = require('../middleware/authMiddleware');


router.post('/click', async (req, res) => {
  try {
    const { vendorId, buttonName } = req.body;

    // Find the vendor
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    // Get the current date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find or create an entry for the vendor on the current day
    let buttonClick = await ButtonClick.findOneAndUpdate(
      { vendor: vendorId, date: today },
      { $setOnInsert: { vendor: vendorId, date: today } },
      { upsert: true, new: true }
    );

    // Use switch case to identify which button is pressed and increment that button field
    switch (buttonName) {
      case 'shareClick':
      case 'whatsappClick':
      case 'callClick':
      case 'profileClick':
      case 'enquireClick':
        buttonClick[buttonName] += 1;
        break;
      default:
        return res.status(400).json({ error: 'Invalid buttonName' });
    }

    // Save the updated entry
    await buttonClick.save();

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/clicks', verifyVendorToken, async (req, res) => {
  try {
      const { startDate, endDate } = req.query;
      const vendorId = req.vendorId;

      // Find button clicks for the specified vendor within the date range
      const clicks = await ButtonClick.find({
          vendor: vendorId,
          date: { $gte: new Date(startDate), $lte: new Date(endDate) }
      });

      // Initialize counts for each button click type
      let totalCallClicks = 0;
      let totalEnquireClicks = 0;
      let totalProfileClicks = 0;
      let totalShareClicks = 0;
      let totalWhatsappClicks = 0;

      clicks.forEach(click => {
          totalCallClicks += click.callClick;
          totalEnquireClicks += click.enquireClick;
          totalProfileClicks += click.profileClick;
          totalShareClicks += click.shareClick;
          totalWhatsappClicks += click.whatsappClick;
      });

      // Return the total counts for each button click type
      const totalClicks = {
          totalCallClicks,
          totalEnquireClicks,
          totalProfileClicks,
          totalShareClicks,
          totalWhatsappClicks
      };

      res.json(totalClicks);
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/profile-clicks', verifyVendorToken, async (req, res) => {
  try {
      const { preset, startDate, endDate } = req.query;
      const vendorId = req.vendorId;

      // Define the date range based on the selected preset or custom range
      let dates = [];
      if (preset) {
          switch (preset) {
              case 'week':
                  const currentDay = new Date();
                  const previousWeekStart = new Date(currentDay);
                  previousWeekStart.setDate(currentDay.getDate() - 7 - ((currentDay.getDay() + 6) % 7)); // Go back to the start of the last week
                  const previousWeekEnd = new Date(previousWeekStart);
                  previousWeekEnd.setDate(previousWeekStart.getDate() + 6); // End of the last week
                  for (let i = 0; i < 7; i++) {
                      const date = new Date(previousWeekStart);
                      date.setDate(previousWeekStart.getDate() + i);
                      dates.push({
                          date: date.toISOString().slice(0, 10),
                          day: getDayOfWeek(date.getDay())
                      });
                  }
                  
                  break;
              case 'month':
                  const lastMonth = new Date();
                  lastMonth.setMonth(lastMonth.getMonth() - 1);
                  const daysInLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0).getDate();
                  for (let i = 1; i <= daysInLastMonth; i++) {
                      const date = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), i);
                      dates.push({
                          date: date.toISOString().slice(0, 10),
                          day: getDayOfWeek(date.getDay())
                      });
                  }
                  break;
              case '90days':
                  const today = new Date();
                  for (let i = 90; i > 0; i--) {
                      const date = new Date(today);
                      date.setDate(today.getDate() - i);
                      dates.push({
                          date: date.toISOString().slice(0, 10),
                          day: getDayOfWeek(date.getDay())
                      });
                  }
                  break;
              case 'range':
                  // Check if both startDate and endDate are provided for range preset
                  if (!startDate || !endDate) {
                      return res.status(400).json({ error: 'Start date and end date are required for range preset' });
                  }
                  // Calculate the dates within the custom range
                  const start = new Date(startDate);
                  const end = new Date(endDate);
                  while (start <= end) {
                      dates.push({
                          date: start.toISOString().slice(0, 10),
                          day: getDayOfWeek(start.getDay())
                      });
                      start.setDate(start.getDate() + 1);
                  }
                  break;
              default:
                  return res.status(400).json({ error: 'Invalid preset' });
          }
      } else {
          return res.status(400).json({ error: 'Preset is required' });
      }

      // Fetch profile clicks data for each day within the date range
      const profileClicksData = [];
    for (const dateObj of dates) {
      const profileClicks = await ButtonClick.findOne({
        vendor: vendorId,
        date: { $gte: new Date(dateObj.date), $lt: new Date(new Date(dateObj.date).getTime() + 24 * 60 * 60 * 1000) }
      }).select('date profileClick');

      // Format date to dd/mm
      const formattedDate = dateObj.date.split('-').reverse().join('/');

      profileClicksData.push({
        date: formattedDate,
        day: dateObj.day,
        profileClick: profileClicks ? profileClicks.profileClick : 0
      });
    }

      res.json(profileClicksData);
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

function getDayOfWeek(dayIndex) {
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return daysOfWeek[dayIndex];
}

function formatDateToDDMM(dateString) {
  const dateParts = dateString.split('-');
  const formattedDate = `${dateParts[2]}/${dateParts[1]}`;
  return formattedDate;
}

// router.post('/get-data-for-date', verifyToken, async (req, res) => {
//   try {
//     const { startDate } = req.body;
    
//     const vendorId = req.vendorId


//     const previousStartDate = new Date(startDate);
//     previousStartDate.setDate(previousStartDate.getDate() - 1);
   
//     // Find all product analysis entries for the specified vendor within the date range for both current and previous weeks
//     const currentDayData = await ProductAnalysis.find({
//       vendor: vendorId,
//       date: {
//         $gte: new Date(startDate)
//       },
//     });

//     const previousDayData = await ProductAnalysis.find({
//       vendor: vendorId,
//      date: {
//         $gte: previousStartDate
//       },
       
//     });
    
//       const currentDate = new Date(startDate);
//       currentDate.setDate(currentDate.getDate());

//       const dayData = {
//         share: 0,
//         call: 0,
//         whatsapp: 0,
//         profile: 0,
//         enquire: 0,
//         prevshare: 0,
//         prevcall: 0,
//         prevwhatsapp: 0,
//         prevprofile: 0,
//         prevenquire: 0,
//       };


//       if (currentDayData.length > 0) {
//         currentDayData.forEach((entry) => {
//           dayData.share += entry.shareClick;
//           dayData.call += entry.callClick;
//           dayData.whatsapp += entry.whatsappClick;
//           dayData.profile += entry.profileClick;
//           dayData.enquire += entry.enquireClick;
//         });
//       }

//       if (previousDayData.length > 0) {
//         previousDayData.forEach((entry) => {
//           dayData.prevshare += entry.shareClick;
//           dayData.prevcall += entry.callClick;
//           dayData.prevwhatsapp += entry.whatsappClick;
//           dayData.prevprofile += entry.profileClick;
//           dayData.prevenquire += entry.enquireClick;
//         });
//       }

    

//     res.json(dayData);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// router.post('/get-data-for-week', verifyToken, async (req, res) => {
//   try {
//     const { startDate } = req.body;
//     const vendorId = req.vendorId

//     const currentEndDate = new Date(startDate);
//     currentEndDate.setDate(currentEndDate.getDate() + 6); // Calculate the end date for the current week

//     const previousStartDate = new Date(startDate);
//     previousStartDate.setDate(previousStartDate.getDate() - 7); // Calculate the start date for the previous week
//     const previousEndDate = new Date(previousStartDate);
//     previousEndDate.setDate(previousEndDate.getDate() + 6); // Calculate the end date for the previous week

//     // Find all product analysis entries for the specified vendor within the date range for both current and previous weeks
//     const currentWeekData = await ProductAnalysis.find({
//       vendor: vendorId,
//       date: {
//         $gte: new Date(startDate),
//         $lte: currentEndDate,
//       },
//     });

//     const previousWeekData = await ProductAnalysis.find({
//       vendor: vendorId,
//       date: {
//         $gte: previousStartDate,
//         $lte: previousEndDate,
//       },
//     });

//     const result = [];

//     for (let i = 0; i < 7; i++) {
//       const currentDate = new Date(startDate);
//       currentDate.setDate(currentDate.getDate() + i);
//       const formattedDate = currentDate.toDateString();
//       const cDate = currentDate.getDate().toString();

//       const dayData = {
//         day: formattedDate.substr(0, 3).toLowerCase(), // Abbreviated day name (e.g., "mon")
//         date: cDate, // Include the full date
//         share: 0,
//         call: 0,
//         whatsapp: 0,
//         profile: 0,
//         enquire: 0,
//         prevshare: 0,
//         prevcall: 0,
//         prevwhatsapp: 0,
//         prevprofile: 0,
//         prevenquire: 0,
//       };

//       // Calculate the button clicks for the current week
//       const currentWeekAnalysis = currentWeekData.filter((entry) => entry.date.toDateString() === formattedDate);
//       if (currentWeekAnalysis.length > 0) {
//         currentWeekAnalysis.forEach((entry) => {
//           dayData.share += entry.shareClick;
//           dayData.call += entry.callClick;
//           dayData.whatsapp += entry.whatsappClick;
//           dayData.profile += entry.profileClick;
//           dayData.enquire += entry.enquireClick;
//         });
//       }

//       // Calculate the button clicks for the previous week
//       const previousWeekAnalysis = previousWeekData.filter((entry) => entry.date.toDateString() === formattedDate);
//       if (previousWeekAnalysis.length > 0) {
//         previousWeekAnalysis.forEach((entry) => {
//           dayData.prevshare += entry.shareClick;
//           dayData.prevcall += entry.callClick;
//           dayData.prevwhatsapp += entry.whatsappClick;
//           dayData.prevprofile += entry.profileClick;
//           dayData.prevenquire += entry.enquireClick;
//         });
//       }

//       result.push(dayData);
//     }

//     res.json(result);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// // Get data for a date range of a month (30 days)
// router.post('/get-data-for-month', verifyToken, async (req, res) => {
//   try {
//     const { startDate } = req.body;
//     const vendorId = req.vendorId
    
//     const currentMonthStartDate = new Date(startDate);
//     currentMonthStartDate.setDate(1); // Set the start date to the first day of the month

//     // Calculate the end date for the current month
//     const currentMonthEndDate = new Date(currentMonthStartDate);
//     currentMonthEndDate.setMonth(currentMonthEndDate.getMonth() + 1);
//     currentMonthEndDate.setDate(currentMonthEndDate.getDate() - 1);

//     const previousMonthStartDate = new Date(currentMonthStartDate);
//     previousMonthStartDate.setMonth(previousMonthStartDate.getMonth() - 1); // Calculate the start date for the previous month

//     const previousMonthEndDate = new Date(currentMonthStartDate);
//     previousMonthEndDate.setDate(0); // Set the end date to the last day of the previous month

//     // Find all product analysis entries for the specified vendor within the date range for both current and previous months
//     const currentMonthData = await ProductAnalysis.find({
//       vendor: vendorId,
//       date: {
//         $gte: currentMonthStartDate,
//         $lte: currentMonthEndDate,
//       },
//     });

//     const previousMonthData = await ProductAnalysis.find({
//       vendor: vendorId,
//       date: {
//         $gte: previousMonthStartDate,
//         $lte: previousMonthEndDate,
//       },
//     });

//     const result = [];

//     // Calculate the number of days in the current month
//     const numDaysInCurrentMonth = (currentMonthEndDate - currentMonthStartDate) / (1000 * 60 * 60 * 24) + 1;

//     for (let i = 0; i < numDaysInCurrentMonth; i++) {
//       const currentDate = new Date(currentMonthStartDate);
//       currentDate.setDate(currentMonthStartDate.getDate() + i);
//       const formattedDate = currentDate.toDateString();
//       const cDate = currentDate.getDate().toString();

//       const dayData = {
//         day: formattedDate.substr(0, 3).toLowerCase(), // Abbreviated day name (e.g., "mon")
//         date: cDate, // Include the full date
//         share: 0,
//         call: 0,
//         whatsapp: 0,
//         profile: 0,
//         enquire: 0,
//         prevshare: 0,
//         prevcall: 0,
//         prevwhatsapp: 0,
//         prevprofile: 0,
//         prevenquire: 0,
//       };

//       // Calculate the button clicks for the current month
//       const currentMonthAnalysis = currentMonthData.filter((entry) => entry.date.toDateString() === formattedDate);
//       if (currentMonthAnalysis.length > 0) {
//         currentMonthAnalysis.forEach((entry) => {
//           dayData.share += entry.shareClick;
//           dayData.call += entry.callClick;
//           dayData.whatsapp += entry.whatsappClick;
//           dayData.profile += entry.profileClick;
//           dayData.enquire += entry.enquireClick;
//         });
//       }

//       // Calculate the button clicks for the previous month
//       const previousMonthAnalysis = previousMonthData.filter((entry) => entry.date.toDateString() === formattedDate);
//       if (previousMonthAnalysis.length > 0) {
//         previousMonthAnalysis.forEach((entry) => {
//           dayData.prevshare += entry.shareClick;
//           dayData.prevcall += entry.callClick;
//           dayData.prevwhatsapp += entry.whatsappClick;
//           dayData.prevprofile += entry.profileClick;
//           dayData.prevenquire += entry.enquireClick;
//         });
//       }

//       result.push(dayData);
//     }

//     res.json(result);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// router.post('/top-products', async (req, res) => {
//   try {
//     const { vendorId, date } = req.body;

//     // Parse the provided date to a Date object
//     const selectedDate = new Date(date);

//     // Calculate the start and end dates for the selected day
//     const dayStartDate = new Date(selectedDate);
//     dayStartDate.setHours(0, 0, 0, 0); // Start of the day
//     const dayEndDate = new Date(selectedDate);
//     dayEndDate.setHours(23, 59, 59, 999); // End of the day

//     // Find the top 5 products for the selected day based on combined traffic
//     const topProductsDay = await ProductAnalysis.aggregate([
//       {
//         $match: {
//           vendor: vendorId,
//           date: {
//             $gte: dayStartDate,
//             $lte: dayEndDate,
//           },
//         },
//       },
//       {
//         $group: {
//           _id: '$productId',
//           totalTraffic: {
//             $sum: {
//               $add: ['$shareClick', '$callClick', '$whatsappClick', '$profileClick', '$enquireClick'],
//             },
//           },
//         },
//       },
//       {
//         $sort: { totalTraffic: -1 }, // Sort by combined traffic in descending order
//       },
//       {
//         $limit: 5,
//       },
//     ]);

//     res.json(topProductsDay);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Server error' });
//   }
// });


module.exports = router;
