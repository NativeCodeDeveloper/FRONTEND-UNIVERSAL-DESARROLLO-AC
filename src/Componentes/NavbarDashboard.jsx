'use client'

import * as React from 'react';
import Link from 'next/link';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

// Navbar minimalista y profesional para el Dashboard
// - Sin íconos
// - Botones claros para navegación principal
// - Menú compacto en mobile (usa un botón de texto "Menú")

export default function NavbarDashboard() {
  const [anchorElNav, setAnchorElNav] = React.useState(null);

  const handleOpenNavMenu = (event) => setAnchorElNav(event.currentTarget);
  const handleCloseNavMenu = () => setAnchorElNav(null);

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Michroma&display=swap');
      `}</style>
      <AppBar position="sticky" color="inherit" elevation={0} sx={{
        bgcolor: 'rgba(255, 255, 255, 0.95)',
        color: '#0F172A',
        borderBottom: '1px solid rgba(148, 163, 184, 0.15)',
        backgroundImage: 'linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(241, 245, 249, 0.95) 100%)',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(59, 130, 246, 0.06)',
        backdropFilter: 'blur(12px) saturate(1.5)',
        transition: 'all 0.3s ease-in-out'
      }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ gap: 2 }}>
          {/* Branding / Título */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
              boxShadow: '0 0 12px rgba(59, 130, 246, 0.4)'
            }} />
            <Typography
              variant="h6"
              component={Link}
              href="/dashboard"
              style={{ textDecoration: 'none', color: 'inherit' }}
              sx={{
                fontFamily: 'Michroma, sans-serif',
                fontWeight: 700,
                letterSpacing: '.08rem',
                color: '#0F172A',
                  fontSize: { xs: '0.85rem', md: '1.1rem' },
                  background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #334155 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }
              }}
            >
                Centro Integral ESSENZA
            </Typography>
          </Box>

          {/* Empuja el bloque de navegación a la derecha */}
          <Box sx={{ flexGrow: 1 }} />

          {/* Navegación Desktop */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5 }}>

              <Button
                  component={Link}
                  href="/dashboard/pedidosCompras"
                  color="inherit"
                  disableRipple
                  sx={{
                    fontFamily: 'Inter, system-ui, sans-serif',
                    textTransform: 'none',
                    fontWeight: 500,
                    fontSize: '0.9rem',
                    borderRadius: '10px',
                    px: 3,
                    py: 1,
                    color: '#475569',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      bottom: 0,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 0,
                      height: '2px',
                      background: 'linear-gradient(90deg, #3B82F6, #2563EB)',
                      transition: 'width 0.3s ease'
                    },
                    '&:hover': {
                      bgcolor: 'rgba(59, 130, 246, 0.08)',
                      color: '#3B82F6',
                      '&::before': {
                        width: '80%'
                      }
                    }
                  }}
              >
                  Pedidos
              </Button>

            <Button
              component={Link}
              href="/dashboard/ingresoProductos"
              color="inherit"
              disableRipple
              sx={{
                fontFamily: 'Inter, system-ui, sans-serif',
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.9rem',
                borderRadius: '10px',
                px: 3,
                py: 1,
                color: '#475569',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 0,
                  height: '2px',
                  background: 'linear-gradient(90deg, #3B82F6, #2563EB)',
                  transition: 'width 0.3s ease'
                },
                '&:hover': {
                  bgcolor: 'rgba(59, 130, 246, 0.08)',
                  color: '#3B82F6',
                  '&::before': {
                    width: '80%'
                  }
                }
              }}
            >
              Productos
            </Button>


              <Button
                  component={Link}
                  href="/dashboard/cupones"
                  color="inherit"
                  disableRipple
                  sx={{
                      fontFamily: 'Inter, system-ui, sans-serif',
                      textTransform: 'none',
                      fontWeight: 500,
                      fontSize: '0.9rem',
                      borderRadius: '10px',
                      px: 3,
                      py: 1,
                      color: '#475569',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&::before': {
                          content: '""',
                          position: 'absolute',
                          bottom: 0,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: 0,
                          height: '2px',
                          background: 'linear-gradient(90deg, #3B82F6, #2563EB)',
                          transition: 'width 0.3s ease'
                      },
                      '&:hover': {
                          bgcolor: 'rgba(59, 130, 246, 0.08)',
                          color: '#3B82F6',
                          '&::before': {
                              width: '80%'
                          }
                      }
                  }}
              >
                  Cupones
              </Button>


              <Button
              component={Link}
              href="/dashboard/calendario"
              color="inherit"
              disableRipple
              sx={{
                fontFamily: 'Inter, system-ui, sans-serif',
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.9rem',
                borderRadius: '10px',
                px: 3,
                py: 1,
                color: '#475569',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 0,
                  height: '2px',
                  background: 'linear-gradient(90deg, #3B82F6, #2563EB)',
                  transition: 'width 0.3s ease'
                },
                '&:hover': {
                  bgcolor: 'rgba(59, 130, 246, 0.08)',
                  color: '#3B82F6',
                  '&::before': {
                    width: '80%'
                  }
                }
              }}
            >
             Agenda
            </Button>




              <Button
                  component={Link}
                  href="/dashboard/agendaCitas"
                  color="inherit"
                  disableRipple
                  sx={{
                      fontFamily: 'Inter, system-ui, sans-serif',
                      textTransform: 'none',
                      fontWeight: 500,
                      fontSize: '0.9rem',
                      borderRadius: '10px',
                      px: 3,
                      py: 1,
                      color: '#475569',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&::before': {
                          content: '""',
                          position: 'absolute',
                          bottom: 0,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: 0,
                          height: '2px',
                          background: 'linear-gradient(90deg, #3B82F6, #2563EB)',
                          transition: 'width 0.3s ease'
                      },
                      '&:hover': {
                          bgcolor: 'rgba(59, 130, 246, 0.08)',
                          color: '#3B82F6',
                          '&::before': {
                              width: '80%'
                          }
                      }
                  }}
              >
                  Clientes Agendados
              </Button>



              <Button
                  component={Link}
                  href="/dashboard/categoriasProductos"
                  color="inherit"
                  disableRipple
                  sx={{
                    fontFamily: 'Inter, system-ui, sans-serif',
                    textTransform: 'none',
                    fontWeight: 500,
                    fontSize: '0.9rem',
                    borderRadius: '10px',
                    px: 3,
                    py: 1,
                    color: '#475569',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      bottom: 0,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 0,
                      height: '2px',
                      background: 'linear-gradient(90deg, #3B82F6, #2563EB)',
                      transition: 'width 0.3s ease'
                    },
                    '&:hover': {
                      bgcolor: 'rgba(59, 130, 246, 0.08)',
                      color: '#3B82F6',
                      '&::before': {
                        width: '80%'
                      }
                    }
                  }}
              >
                  Categorías
              </Button>

            <Button
              component={Link}
              href="/dashboard/publicaciones"
              color="inherit"
              disableRipple
              sx={{
                fontFamily: 'Inter, system-ui, sans-serif',
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.9rem',
                borderRadius: '10px',
                px: 3,
                py: 1,
                color: '#475569',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 0,
                  height: '2px',
                  background: 'linear-gradient(90deg, #3B82F6, #2563EB)',
                  transition: 'width 0.3s ease'
                },
                '&:hover': {
                  bgcolor: 'rgba(59, 130, 246, 0.08)',
                  color: '#3B82F6',
                  '&::before': {
                    width: '80%'
                  }
                }
              }}
            >
              Publicaciones
            </Button>


          </Box>

          {/* Navegación Mobile (xs-sm) con botón de texto */}
          <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
            <Button
              aria-controls={Boolean(anchorElNav) ? 'menu-appbar' : undefined}
              aria-haspopup="true"
              aria-expanded={Boolean(anchorElNav) ? 'true' : undefined}
              onClick={handleOpenNavMenu}
              color="inherit"
              sx={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontWeight: 500,
                fontSize: '0.9rem',
                color: '#475569',
                px: 2,
                borderRadius: '10px',
                '&:hover': {
                  bgcolor: 'rgba(59, 130, 246, 0.08)',
                  color: '#3B82F6'
                }
              }}
            >
              Menú
            </Button>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              keepMounted
              sx={{
                '& .MuiPaper-root': {
                  borderRadius: '12px',
                  mt: 1,
                  boxShadow: '0 4px 24px rgba(15, 23, 42, 0.1), 0 8px 48px rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(148, 163, 184, 0.15)',
                  backdropFilter: 'blur(20px) saturate(1.4)',
                  bgcolor: 'rgba(255, 255, 255, 0.65)'
                }
              }}
            >
              <MenuItem
                onClick={handleCloseNavMenu}
                sx={{
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontSize: '0.9rem',
                  py: 1.5,
                  px: 3,
                  color: '#475569',
                  '&:hover': {
                    bgcolor: 'rgba(59, 130, 246, 0.08)',
                    color: '#3B82F6'
                  }
                }}
              >
                <Link href="/dashboard/pedidosCompras" style={{ textDecoration: 'none', color: 'inherit', width: '100%' }}>
                  Pedidos
                </Link>
              </MenuItem>
              <MenuItem
                onClick={handleCloseNavMenu}
                sx={{
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontSize: '0.9rem',
                  py: 1.5,
                  px: 3,
                  color: '#475569',
                  '&:hover': {
                    bgcolor: 'rgba(59, 130, 246, 0.08)',
                    color: '#3B82F6'
                  }
                }}
              >
                <Link href="/dashboard/ingresoProductos" style={{ textDecoration: 'none', color: 'inherit', width: '100%' }}>
                  Productos
                </Link>
              </MenuItem>
              <MenuItem
                onClick={handleCloseNavMenu}
                sx={{
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontSize: '0.9rem',
                  py: 1.5,
                  px: 3,
                  color: '#475569',
                  '&:hover': {
                    bgcolor: 'rgba(59, 130, 246, 0.08)',
                    color: '#3B82F6'
                  }
                }}
              >
                <Link href="/dashboard" style={{ textDecoration: 'none', color: 'inherit', width: '100%' }}>
                  Agenda
                </Link>
              </MenuItem>


                <MenuItem
                    onClick={handleCloseNavMenu}
                    sx={{
                        fontFamily: 'Inter, system-ui, sans-serif',
                        fontSize: '0.9rem',
                        py: 1.5,
                        px: 3,
                        color: '#475569',
                        '&:hover': {
                            bgcolor: 'rgba(59, 130, 246, 0.08)',
                            color: '#3B82F6'
                        }
                    }}
                >
                    <Link href="/dashboard/cupones" style={{ textDecoration: 'none', color: 'inherit', width: '100%' }}>
                        Cupones
                    </Link>
                </MenuItem>



              <MenuItem
                onClick={handleCloseNavMenu}
                sx={{
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontSize: '0.9rem',
                  py: 1.5,
                  px: 3,
                  color: '#475569',
                  '&:hover': {
                    bgcolor: 'rgba(59, 130, 246, 0.08)',
                    color: '#3B82F6'
                  }
                }}
              >
                <Link href="/dashboard/categoriasProductos" style={{ textDecoration: 'none', color: 'inherit', width: '100%' }}>
                  Categorías
                </Link>
              </MenuItem>




                <MenuItem
                    onClick={handleCloseNavMenu}
                    sx={{
                        fontFamily: 'Inter, system-ui, sans-serif',
                        fontSize: '0.9rem',
                        py: 1.5,
                        px: 3,
                        color: '#475569',
                        '&:hover': {
                            bgcolor: 'rgba(59, 130, 246, 0.08)',
                            color: '#3B82F6'
                        }
                    }}
                >
                    <Link href="/dashboard/calendario" style={{ textDecoration: 'none', color: 'inherit', width: '100%' }}>
                       Agenda
                    </Link>
                </MenuItem>



                <MenuItem
                    onClick={handleCloseNavMenu}
                    sx={{
                        fontFamily: 'Inter, system-ui, sans-serif',
                        fontSize: '0.9rem',
                        py: 1.5,
                        px: 3,
                        color: '#475569',
                        '&:hover': {
                            bgcolor: 'rgba(59, 130, 246, 0.08)',
                            color: '#3B82F6'
                        }
                    }}
                >
                    <Link href="/dashboard/agendaCitas" style={{ textDecoration: 'none', color: 'inherit', width: '100%' }}>
                        Clientes Agendados
                    </Link>
                </MenuItem>



              <MenuItem
                onClick={handleCloseNavMenu}
                sx={{
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontSize: '0.9rem',
                  py: 1.5,
                  px: 3,
                  color: '#475569',
                  '&:hover': {
                    bgcolor: 'rgba(59, 130, 246, 0.08)',
                    color: '#3B82F6'
                  }
                }}
              >
                <Link href="/dashboard/publicaciones" style={{ textDecoration: 'none', color: 'inherit', width: '100%' }}>
                  Publicaciones
                </Link>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
    </>
  );
}
