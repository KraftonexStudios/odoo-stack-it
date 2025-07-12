import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Plus,
  LogOut,
  User,
  Users,
  Menu,
  Home,
  HelpCircle,
  Sparkles,
  Zap,
  Globe,
  Star,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationPanel } from "@/components/notifications/NotificationPanel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="sticky px-40 top-0 z-50 w-full border-b border-slate-200/20 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 shadow-sm">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 via-indigo-50/20 to-purple-50/30" />

      <div className="container mx-auto px-6 lg:px-8 h-16 flex items-center justify-between relative">
        {/* Logo Section */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="relative">
            <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
            <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              StackIt
            </span>
            <span className="text-xs text-slate-500 -mt-1">Community Q&A</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex">
          <NavigationMenu>
            <NavigationMenuList className="space-x-1">
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 data-[state=open]:bg-gradient-to-r data-[state=open]:from-blue-50 data-[state=open]:to-indigo-50 border-0 text-slate-700 hover:text-blue-700 transition-all duration-200">
                  <Home className="w-4 h-4 mr-2" />
                  Platform
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid gap-3 p-6 w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr] bg-white/95 backdrop-blur-sm border border-slate-200/50 shadow-xl rounded-xl">
                    <div className="row-span-3">
                      <NavigationMenuLink asChild>
                        <Link
                          to="/"
                          className="flex h-full w-full select-none flex-col justify-end rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 p-6 no-underline outline-none focus:shadow-md hover:from-blue-100 hover:to-indigo-200 transition-all duration-200 border border-blue-200/50"
                        >
                          <div className="relative">
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg blur opacity-20" />
                            <MessageSquare className="h-8 w-8 text-blue-600 relative" />
                          </div>
                          <div className="mb-2 mt-4 text-lg font-semibold text-slate-900">StackIt</div>
                          <p className="text-sm leading-tight text-slate-600">
                            Community-driven Q&A platform for developers
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </div>
                    <NavigationMenuLink asChild>
                      <Link
                        to="/"
                        className="block select-none space-y-1 rounded-lg p-3 leading-none no-underline outline-none transition-colors hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 focus:bg-gradient-to-r focus:from-blue-50 focus:to-indigo-50 border border-transparent hover:border-blue-200/50"
                      >
                        <div className="text-sm font-medium leading-none text-slate-900 flex items-center">
                          <Globe className="w-4 h-4 mr-2 text-blue-600" />
                          Home
                        </div>
                        <p className="line-clamp-2 text-sm leading-snug text-slate-600">
                          Browse latest questions and answers
                        </p>
                      </Link>
                    </NavigationMenuLink>
                    {user && (
                      <NavigationMenuLink asChild>
                        <Link
                          to="/ask"
                          className="block select-none space-y-1 rounded-lg p-3 leading-none no-underline outline-none transition-colors hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 focus:bg-gradient-to-r focus:from-green-50 focus:to-emerald-50 border border-transparent hover:border-green-200/50"
                        >
                          <div className="text-sm font-medium leading-none flex items-center text-slate-900">
                            <HelpCircle className="w-4 h-4 mr-2 text-green-600" />
                            Ask Question
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-slate-600">
                            Get help from the community
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    )}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 data-[state=open]:bg-gradient-to-r data-[state=open]:from-purple-50 data-[state=open]:to-pink-50 border-0 text-slate-700 hover:text-purple-700 transition-all duration-200">
                  <Users className="w-4 h-4 mr-2" />
                  Communities
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid w-[400px] gap-3 p-6 md:w-[500px] md:grid-cols-2 lg:w-[600px] bg-white/95 backdrop-blur-sm border border-slate-200/50 shadow-xl rounded-xl">
                    <NavigationMenuLink asChild>
                      <Link
                        to="/communities"
                        className="block select-none space-y-1 rounded-lg p-3 leading-none no-underline outline-none transition-colors hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 focus:bg-gradient-to-r focus:from-purple-50 focus:to-pink-50 border border-transparent hover:border-purple-200/50"
                      >
                        <div className="text-sm font-medium leading-none text-slate-900 flex items-center">
                          <Star className="w-4 h-4 mr-2 text-purple-600" />
                          Browse Communities
                        </div>
                        <p className="line-clamp-2 text-sm leading-snug text-slate-600">
                          Discover and join topic-specific communities
                        </p>
                      </Link>
                    </NavigationMenuLink>
                    {user && (
                      <NavigationMenuLink asChild>
                        <Link
                          to="/create-community"
                          className="block select-none space-y-1 rounded-lg p-3 leading-none no-underline outline-none transition-colors hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 focus:bg-gradient-to-r focus:from-indigo-50 focus:to-blue-50 border border-transparent hover:border-indigo-200/50"
                        >
                          <div className="text-sm font-medium leading-none text-slate-900 flex items-center">
                            <Sparkles className="w-4 h-4 mr-2 text-indigo-600" />
                            Create Community
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-slate-600">
                            Start your own community space
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    )}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Mobile Menu Button */}
        <div className="lg:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="relative hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 text-slate-700 hover:text-blue-700 transition-all duration-200"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="hidden lg:flex items-center space-x-3">
          {user ? (
            <>
              <NotificationPanel />

              <Button
                onClick={() => navigate("/ask")}
                size="sm"
                className="relative overflow-hidden group bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
                <Plus className="w-4 h-4 mr-2 relative z-10" />
                <span className="relative z-10 font-medium">Ask Question</span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="relative group hover:bg-gradient-to-r hover:from-slate-50 hover:to-gray-50 text-slate-700 hover:text-slate-900 transition-all duration-200 border border-slate-200/50 hover:border-slate-300/50"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <User className="w-3 h-3 text-white" />
                      </div>
                      <span className="max-w-[100px] truncate font-medium">
                        {user.user_metadata?.name || user.email}
                      </span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 bg-white/95 backdrop-blur-sm border border-slate-200/50 shadow-xl rounded-xl"
                >
                  <DropdownMenuItem
                    onClick={() => navigate("/communities")}
                    className="cursor-pointer hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-200 rounded-lg mx-1 my-1"
                  >
                    <Users className="w-4 h-4 mr-2 text-purple-600" />
                    <span className="text-slate-700">My Communities</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate("/create-community")}
                    className="cursor-pointer hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 transition-all duration-200 rounded-lg mx-1 my-1"
                  >
                    <Plus className="w-4 h-4 mr-2 text-indigo-600" />
                    <span className="text-slate-700">Create Community</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-slate-200/50" />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="cursor-pointer hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 transition-all duration-200 rounded-lg mx-1 my-1"
                  >
                    <LogOut className="w-4 h-4 mr-2 text-red-500" />
                    <span className="text-red-600">Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                onClick={() => navigate("/communities")}
                size="sm"
                className="hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 text-slate-700 hover:text-purple-700 transition-all duration-200 border border-slate-200/50 hover:border-purple-200/50"
              >
                <Users className="w-4 h-4 mr-2" />
                <span className="font-medium">Communities</span>
              </Button>
              <Button
                onClick={() => navigate("/auth")}
                size="sm"
                className="relative overflow-hidden group bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
                <Zap className="w-4 h-4 mr-2 relative z-10" />
                <span className="relative z-10 font-medium">Sign In</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200/50 bg-white/95 backdrop-blur-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 via-indigo-50/20 to-purple-50/30" />
          <div className="container mx-auto px-6 py-4 space-y-2 relative">
            <Link
              to="/"
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 text-slate-700 hover:text-blue-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Home className="w-4 h-4" />
              <span className="font-medium">Home</span>
            </Link>
            <Link
              to="/communities"
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-200 text-slate-700 hover:text-purple-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Users className="w-4 h-4" />
              <span className="font-medium">Communities</span>
            </Link>
            {user && (
              <>
                <Link
                  to="/ask"
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all duration-200 text-slate-700 hover:text-green-700"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Plus className="w-4 h-4" />
                  <span className="font-medium">Ask Question</span>
                </Link>
                <Link
                  to="/create-community"
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 transition-all duration-200 text-slate-700 hover:text-indigo-700"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="font-medium">Create Community</span>
                </Link>
                <div className="border-t border-slate-200/50 pt-3 mt-3">
                  <button
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 transition-all duration-200 w-full text-left text-red-600 hover:text-red-700"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              </>
            )}
            {!user && (
              <div className="border-t border-slate-200/50 pt-3 mt-3">
                <Button
                  onClick={() => {
                    navigate("/auth");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  <span className="font-medium">Sign In</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
