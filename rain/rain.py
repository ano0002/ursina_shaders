from ursina import *

app = Ursina()

sprite = Entity(model="cube",scale=10,texture="noise",collider="box",z=10)

rain_shader = Shader(fragment=open("rain.frag").read())

camera.shader = rain_shader

Sky(texture="skybox.jpg")

EditorCamera()

app.run()