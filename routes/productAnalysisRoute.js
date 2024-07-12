const express = require('express');
const router = express.Router();
const ButtonClick = require('../models/ButtonClick');
const Enquiries = require('../models/Enquiries');
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

router.post('/profile-hit', async (req, res) => {
  try {
    const { buttonName } = req.body;
    const { city, companyName } = req.query;

    const cityRegex = new RegExp(city, 'i');
    const companyNameRegex = new RegExp(companyName, 'i');

    if (!city || !companyName) {
    console.log("city and Company name is requred");
      return res.status(404).json({ error: 'city and Company name is requred' });
    }
    else {
      // Search for the vendor in the Vendor collection by case-insensitive city and companyName
      const vendor = await Vendor.findOne({ city: cityRegex, companyName: companyNameRegex });
      if (!vendor) {
        return res.status(404).json({ error: 'Vendor not found' });
      }
      // Get the vendor's ID from the found vendor document
      const vendorId = vendor._id;



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

      res.json({ 
        success: true,
        vendor
      });
    }
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

router.get('/total-profile-clicks', verifyVendorToken, async (req, res) => {
  try {
    const vendorId = req.vendorId;

    // Find all profile clicks for the given vendor
    const clicks = await ButtonClick.find({ vendor: vendorId }).select('profileClick').exec();

    // Sum all profile clicks
    const totalProfileClicks = clicks.reduce((acc, click) => acc + click.profileClick, 0);

    res.json({ totalProfileClicks });
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

router.get('/enquire-clicks', verifyVendorToken, async (req, res) => {
  try {
    const { preset, startDate, endDate } = req.query;
    const vendorId = req.vendorId;

    // Helper function to get the day of the week as a string
    const getDayOfWeek = (dayIndex) => {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return days[dayIndex];
    };

    // Helper function to calculate the start and end of a week
    const calculateWeekRange = (currentDate) => {
      const start = new Date(currentDate);
      start.setDate(currentDate.getDate() - currentDate.getDay());
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return { start, end };
    };

    // Define the date range based on the selected preset or custom range
    let dates = [];

    if (preset) {
      switch (preset) {
        case 'week':
          const currentDay = new Date();
          const lastWeekStart = new Date(currentDay);
          lastWeekStart.setDate(currentDay.getDate() - 7 - ((currentDay.getDay() + 6) % 7)); // Go back to the start of the last week
          for (let i = 0; i < 7; i++) {
            const date = new Date(lastWeekStart);
            date.setDate(lastWeekStart.getDate() + i);
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
              date: i.toString(), // Only the day of the month
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
              date: date.getDate().toString(), // Only the day of the month
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

    // Find all enquiries for the given vendor
    const enquiries = await Enquiries.find({ vendor: vendorId });

    // Create a result array to store the number of enquiries for each date
    const result = dates.map(dateObj => {
      const count = enquiries.filter(enquiry => {
        const enquiryDate = (preset === 'month' || preset === '90days')
          ? new Date(enquiry.date).getDate().toString() // Only the day of the month for month and 90days presets
          : new Date(enquiry.date).toISOString().slice(0, 10);
        return enquiryDate === dateObj.date;
      }).length;
      return { ...dateObj, enquiries: count };
    });

    // Calculate total enquiries for this week and last week
    const today = new Date();
    const currentWeekRange = calculateWeekRange(today);
    const lastWeekRange = calculateWeekRange(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7));

    const totalEnquiriesCurrentWeek = enquiries.filter(enquiry => {
      const enquiryDate = new Date(enquiry.date);
      return enquiryDate >= currentWeekRange.start && enquiryDate <= currentWeekRange.end;
    }).length;

    const totalEnquiriesLastWeek = enquiries.filter(enquiry => {
      const enquiryDate = new Date(enquiry.date);
      return enquiryDate >= lastWeekRange.start && enquiryDate <= lastWeekRange.end;
    }).length;

    res.json({
      result,
      totalEnquiriesCurrentWeek,
      totalEnquiriesLastWeek
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});








module.exports = router;
