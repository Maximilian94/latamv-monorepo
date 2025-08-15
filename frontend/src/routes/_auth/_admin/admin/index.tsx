import { createFileRoute, Link } from '@tanstack/react-router';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
} from '@mui/material';
import {
  FlightTakeoff,
  Event,
  Quiz,
  School,
  Assessment,
  Settings,
} from '@mui/icons-material';

const Admin = () => {
  const adminSections = [
    {
      title: 'Flight Management',
      description: 'Manage routes, flights, and flight duties',
      icon: FlightTakeoff,
      color: 'bg-blue-500',
      items: [
        {
          name: 'Routes',
          href: '/admin/routes',
          description: 'Manage flight routes and schedules',
        },
      ],
    },
    {
      title: 'Events System',
      description: 'Monitor and manage flight events',
      icon: Event,
      color: 'bg-green-500',
      items: [
        {
          name: 'Events',
          href: '/admin/events',
          description: 'View and manage flight events',
        },
      ],
    },
    {
      title: 'Exam System',
      description: 'Manage exams, questions, and templates',
      icon: Quiz,
      color: 'bg-purple-500',
      items: [
        {
          name: 'Question Tags',
          href: '/admin/question-tags',
          description: 'Manage question categories and tags',
        },
        {
          name: 'Questions',
          href: '/admin/questions',
          description: 'Manage exam questions and alternatives',
        },
        {
          name: 'Exam Templates',
          href: '/admin/exam-templates',
          description: 'Create and manage exam templates',
        },
        {
          name: 'Exams',
          href: '/admin/exams',
          description: 'View and manage user exams',
        },
      ],
    },
    {
      title: 'System',
      description: 'System configuration and settings',
      icon: Settings,
      color: 'bg-gray-500',
      items: [
        {
          name: 'Users',
          href: '/admin/users',
          description: 'Manage system users and permissions',
        },
        {
          name: 'Settings',
          href: '/admin/settings',
          description: 'System configuration and preferences',
        },
      ],
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">
          Manage your LATAM Virtual system from one central location
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminSections.map((section) => {
          const IconComponent = section.icon;
          return (
            <Card key={section.title} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${section.color} text-white`}>
                    <IconComponent />
                  </div>
                  <div>
                    <Typography variant="h6">{section.title}</Typography>
                    <Typography variant="body2">{section.description}</Typography>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {section.items.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className="block p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                    >
                      <div className="font-medium text-gray-900">{item.name}</div>
                      <div className="text-sm text-gray-600">{item.description}</div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Routes</p>
                  <p className="text-2xl font-bold text-blue-900">--</p>
                </div>
                <FlightTakeoff className="text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Active Events</p>
                  <p className="text-2xl font-bold text-green-900">--</p>
                </div>
                <Event className="text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Total Exams</p>
                  <p className="text-2xl font-bold text-purple-900">--</p>
                </div>
                <Assessment className="text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 font-medium">Questions</p>
                  <p className="text-2xl font-bold text-orange-900">--</p>
                </div>
                <School className="text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export const Route = createFileRoute('/_auth/_admin/admin/')({
  component: () => <Admin />,
});
