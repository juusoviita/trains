from django.urls import path
from . import views

urlpatterns = [
    path("", views.index, name="index"),
    # API paths
    path("stations", views.stations, name="stations"),
    path("timetable", views.timetable, name="timetable")
]
