import Calculator from './calculator'

export default function Home() {
  return (
    <main
      className="flex flex-1 flex-col items-center justify-center p-4"
      style={{ background: '#fdd5e0' }}
    >
      <Calculator />
    </main>
  )
}
