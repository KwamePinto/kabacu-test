const { authenticateAdminUser } = require('../../config/authMiddleware');
const { getAccountInfo, fetchHistory } = require('../../services/ourdatastore');

const STATUS_OPTIONS = [
  { value: 'ALL',        label: 'All' },
  { value: 'success',    label: 'Success' },
  { value: 'fail',       label: 'Fail' },
  { value: 'processing', label: 'Processing' },
];

const PLAN_STATUS = {
  1: { label: 'Success',    cls: 'badge-success'  },
  2: { label: 'Fail',       cls: 'badge-danger'   },
  3: { label: 'Processing', cls: 'badge-warning'  },
};

exports.viewDashboard = [
  authenticateAdminUser,
  async (req, res) => {
    const page   = Math.max(1, parseInt(req.query.page)   || 1);
    const status = req.query.status || 'ALL';
    const search = (req.query.search || '').trim();

    let accountInfo   = null;
    let transactions  = [];
    let pagination    = {};
    let error         = null;

    try {
      const [info, history] = await Promise.all([
        getAccountInfo(),
        fetchHistory({ page, status, search, perPage: 20 }),
      ]);

      accountInfo  = info;
      transactions = (history.data || []).map(t => ({
        ...t,
        statusInfo: PLAN_STATUS[t.plan_status] || { label: 'Unknown', cls: 'badge-secondary' },
      }));
      pagination = {
        currentPage: history.current_page,
        lastPage:    history.last_page,
        total:       history.total,
        from:        history.from,
        to:          history.to,
      };
    } catch (err) {
      error = err.message === 'ADEX_ID_STALE'
        ? 'The OurDataStore ADEX ID has changed. Go to <a href="/admin/settings#group-adex"><strong>Site Settings → OurDataStore ADEX ID</strong></a> and paste the new ID from your browser DevTools.'
        : err.message;
    }

    res.render('adminview/ourdatastore', {
      layout: 'layouts/adminLayout',
      accountInfo,
      transactions,
      pagination,
      filters: { status, search },
      statusOptions: STATUS_OPTIONS,
      error,
      csrfToken: req.csrfToken ? req.csrfToken() : '',
    });
  },
];
