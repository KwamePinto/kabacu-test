const Product = require('../../models/ProductsModal');

exports.getCourses = async (req, res) => {
  try {
    const courses = await Product.find({
      category: 'COURSES',
      'coursesDetails.published': true
    })
      .sort({ createdAt: -1 })
      .select('_id images coursesDetails.title coursesDetails.courseCategory coursesDetails.difficulty');

    const data = courses.map(c => ({
      id:         c._id,
      title:      c.coursesDetails?.title || '',
      thumbnail:  c.images?.[0] || null,
      category:   c.coursesDetails?.courseCategory || '',
      difficulty: c.coursesDetails?.difficulty || '',
    }));

    res.json({ success: true, courses: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getCourse = async (req, res) => {
  try {
    const course = await Product.findOne({
      _id: req.params.id,
      category: 'COURSES',
      'coursesDetails.published': true
    });

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const d = course.coursesDetails || {};

    res.json({
      success: true,
      course: {
        id:                course._id,
        title:             d.title || '',
        thumbnail:         course.images?.[0] || null,
        category:          d.courseCategory || '',
        difficulty:        d.difficulty || '',
        instructor:        d.instructor || '',
        price:             d.course_price || 0,
        description:       d.course_description || '',
        overview:          d.overview || '',
        whatYouWillLearn:  d.whatYouWillLearn || [],
        chapterCount:      d.chapterCount || 0,
        lessonCount:       d.lessonCount || 0,
        estimatedDuration: d.estimatedDuration || '',
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
